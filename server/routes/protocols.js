const express = require('express');
const { queryAll, queryOne, runSql } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { PROTOCOL_TYPES, TEMPLATES } = require('../data/protocolTemplates');

const router = express.Router();
router.use(authMiddleware);

// List all protocols for the lab
router.get('/', (req, res) => {
  try {
    const protocols = queryAll(
      'SELECT * FROM protocols WHERE lab_id = ? ORDER BY updated_at DESC',
      [req.labId]
    );

    // Attach section progress for each protocol
    const result = protocols.map((p) => {
      const sections = queryAll(
        'SELECT status FROM protocol_sections WHERE protocol_id = ?',
        [p.id]
      );
      return {
        ...p,
        totalSections: sections.length,
        completedSections: sections.filter((s) => s.status === 'complete').length,
        typeLabel: PROTOCOL_TYPES[p.protocol_type]?.label || p.protocol_type,
        guideline: PROTOCOL_TYPES[p.protocol_type]?.guideline || '',
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new protocol
router.post('/', (req, res) => {
  try {
    const { title, protocol_type } = req.body;

    if (!protocol_type || !TEMPLATES[protocol_type]) {
      return res.status(400).json({
        error: 'Invalid protocol type. Must be one of: ' + Object.keys(TEMPLATES).join(', '),
      });
    }

    const protocolTitle = title || 'Untitled Protocol';
    const { lastInsertRowid } = runSql(
      'INSERT INTO protocols (lab_id, title, protocol_type) VALUES (?, ?, ?)',
      [req.labId, protocolTitle, protocol_type]
    );

    // Populate sections from template
    const template = TEMPLATES[protocol_type];
    for (const section of template) {
      runSql(
        'INSERT INTO protocol_sections (protocol_id, section_key, section_title, section_order, guideline_text) VALUES (?, ?, ?, ?, ?)',
        [lastInsertRowid, section.key, section.title, section.order, section.guidelineText]
      );
    }

    // Return the created protocol with sections
    const protocol = queryOne('SELECT * FROM protocols WHERE id = ?', [lastInsertRowid]);
    const sections = queryAll(
      'SELECT * FROM protocol_sections WHERE protocol_id = ? ORDER BY section_order',
      [lastInsertRowid]
    );

    res.status(201).json({ ...protocol, sections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single protocol with all sections
router.get('/:id', (req, res) => {
  try {
    const protocol = queryOne('SELECT * FROM protocols WHERE id = ? AND lab_id = ?', [
      req.params.id,
      req.labId,
    ]);
    if (!protocol) return res.status(404).json({ error: 'Protocol not found' });

    const sections = queryAll(
      'SELECT * FROM protocol_sections WHERE protocol_id = ? ORDER BY section_order',
      [protocol.id]
    );

    res.json({
      ...protocol,
      sections,
      typeLabel: PROTOCOL_TYPES[protocol.protocol_type]?.label || protocol.protocol_type,
      guideline: PROTOCOL_TYPES[protocol.protocol_type]?.guideline || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update protocol metadata
router.put('/:id', (req, res) => {
  try {
    const protocol = queryOne('SELECT * FROM protocols WHERE id = ? AND lab_id = ?', [
      req.params.id,
      req.labId,
    ]);
    if (!protocol) return res.status(404).json({ error: 'Protocol not found' });

    const { title, status } = req.body;
    if (title !== undefined) {
      runSql('UPDATE protocols SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        title,
        protocol.id,
      ]);
    }
    if (status !== undefined) {
      runSql('UPDATE protocols SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        status,
        protocol.id,
      ]);
    }

    const updated = queryOne('SELECT * FROM protocols WHERE id = ?', [protocol.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a protocol
router.delete('/:id', (req, res) => {
  try {
    const protocol = queryOne('SELECT * FROM protocols WHERE id = ? AND lab_id = ?', [
      req.params.id,
      req.labId,
    ]);
    if (!protocol) return res.status(404).json({ error: 'Protocol not found' });

    runSql('DELETE FROM protocol_sections WHERE protocol_id = ?', [protocol.id]);
    runSql('DELETE FROM protocols WHERE id = ?', [protocol.id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a section
router.put('/:id/sections/:sectionId', (req, res) => {
  try {
    // Verify protocol ownership
    const protocol = queryOne('SELECT * FROM protocols WHERE id = ? AND lab_id = ?', [
      req.params.id,
      req.labId,
    ]);
    if (!protocol) return res.status(404).json({ error: 'Protocol not found' });

    const section = queryOne(
      'SELECT * FROM protocol_sections WHERE id = ? AND protocol_id = ?',
      [req.params.sectionId, protocol.id]
    );
    if (!section) return res.status(404).json({ error: 'Section not found' });

    const { content, status } = req.body;
    const updates = [];
    const params = [];

    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(section.id);
      runSql(`UPDATE protocol_sections SET ${updates.join(', ')} WHERE id = ?`, params);

      // Also update parent protocol's updated_at
      runSql('UPDATE protocols SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [protocol.id]);
    }

    const updated = queryOne('SELECT * FROM protocol_sections WHERE id = ?', [section.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate section content using LLM
router.post('/:id/sections/:sectionId/generate', async (req, res) => {
  try {
    // Check API key first
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({
        error: 'Anthropic API key not configured. Please set the ANTHROPIC_API_KEY environment variable.',
      });
    }

    // Verify protocol ownership
    const protocol = queryOne('SELECT * FROM protocols WHERE id = ? AND lab_id = ?', [
      req.params.id,
      req.labId,
    ]);
    if (!protocol) return res.status(404).json({ error: 'Protocol not found' });

    const section = queryOne(
      'SELECT * FROM protocol_sections WHERE id = ? AND protocol_id = ?',
      [req.params.sectionId, protocol.id]
    );
    if (!section) return res.status(404).json({ error: 'Section not found' });

    const { additionalContext } = req.body;

    // Get completed sibling sections for context
    const completedSections = queryAll(
      'SELECT section_title, content FROM protocol_sections WHERE protocol_id = ? AND status = ? AND id != ? ORDER BY section_order',
      [protocol.id, 'complete', section.id]
    );

    const typeInfo = PROTOCOL_TYPES[protocol.protocol_type];

    // Build system prompt
    const systemPrompt = `You are an expert research protocol writer specializing in clinical and biomedical research. You are helping draft a ${typeInfo.label} protocol following ${typeInfo.guideline} guidelines.

The protocol is titled: "${protocol.title}"

You are writing the section: "${section.section_title}"

The guideline states: "${section.guideline_text}"

Write professional, detailed content appropriate for a research protocol submission. Use formal academic writing. Structure content with clear paragraphs. Do not include the section title itself — just write the body content for this section. Be specific and thorough while allowing the researcher to fill in study-specific details where needed (use [brackets] for placeholders they should customize).`;

    // Build user message with context
    let userMessage = `Please draft the content for the "${section.section_title}" section of this protocol.`;

    if (completedSections.length > 0) {
      userMessage += '\n\nThe following sections have already been completed for context:\n';
      for (const cs of completedSections) {
        // Truncate long sections to avoid token waste
        const truncated = cs.content.length > 500 ? cs.content.substring(0, 500) + '...' : cs.content;
        userMessage += `\n--- ${cs.section_title} ---\n${truncated}\n`;
      }
    }

    if (additionalContext) {
      userMessage += `\n\nAdditional context from the researcher:\n${additionalContext}`;
    }

    // Call Anthropic API
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const generatedContent = message.content[0]?.text || '';

    res.json({ generatedContent });
  } catch (err) {
    if (err.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment and try again.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Export protocol as Word document
router.get('/:id/export', async (req, res) => {
  try {
    const protocol = queryOne('SELECT * FROM protocols WHERE id = ? AND lab_id = ?', [
      req.params.id,
      req.labId,
    ]);
    if (!protocol) return res.status(404).json({ error: 'Protocol not found' });

    const sections = queryAll(
      'SELECT * FROM protocol_sections WHERE protocol_id = ? ORDER BY section_order',
      [protocol.id]
    );

    const typeInfo = PROTOCOL_TYPES[protocol.protocol_type];
    const lab = queryOne('SELECT * FROM labs WHERE id = ?', [req.labId]);

    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      HeadingLevel,
      AlignmentType,
      PageBreak,
      TabStopPosition,
      TabStopType,
    } = require('docx');

    // Build document sections
    const docChildren = [];

    // Title page
    docChildren.push(
      new Paragraph({ spacing: { before: 4000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: protocol.title,
            bold: true,
            size: 48,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `${typeInfo.label} Protocol`,
            size: 28,
            font: 'Calibri',
            color: '666666',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `Guideline: ${typeInfo.guideline}`,
            size: 24,
            font: 'Calibri',
            color: '888888',
            italics: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: lab ? lab.lab_name : '',
            size: 24,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Generated: ${new Date().toLocaleDateString()}`,
            size: 22,
            font: 'Calibri',
            color: '999999',
          }),
        ],
      }),
      new Paragraph({
        children: [new PageBreak()],
      })
    );

    // Table of Contents header
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: 'Table of Contents',
            bold: true,
            font: 'Calibri',
          }),
        ],
      })
    );

    // Simple TOC listing
    sections.forEach((section, index) => {
      docChildren.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: `${index + 1}. ${section.section_title}`,
              size: 22,
              font: 'Calibri',
            }),
          ],
        })
      );
    });

    docChildren.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );

    // Protocol sections
    sections.forEach((section, index) => {
      // Section heading
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          children: [
            new TextRun({
              text: `${index + 1}. ${section.section_title}`,
              bold: true,
              font: 'Calibri',
            }),
          ],
        })
      );

      // Section content
      const content = section.content || '[This section has not been completed yet.]';
      const paragraphs = content.split('\n\n');

      for (const para of paragraphs) {
        if (para.trim()) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 200 },
              children: [
                new TextRun({
                  text: para.trim(),
                  size: 22,
                  font: 'Calibri',
                }),
              ],
            })
          );
        }
      }
    });

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: docChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    const filename = protocol.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available protocol types
router.get('/types/list', (req, res) => {
  const types = Object.entries(PROTOCOL_TYPES).map(([key, info]) => ({
    key,
    ...info,
    sectionCount: TEMPLATES[key]?.length || 0,
  }));
  res.json(types);
});

module.exports = router;
