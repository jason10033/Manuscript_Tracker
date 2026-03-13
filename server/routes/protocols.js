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

    const result = protocols.map((p) => {
      const sections = queryAll(
        'SELECT status, user_notes FROM protocol_sections WHERE protocol_id = ?',
        [p.id]
      );
      return {
        ...p,
        totalSections: sections.length,
        completedSections: sections.filter((s) => s.status === 'complete').length,
        notesFilledCount: sections.filter((s) => s.user_notes && s.user_notes.trim()).length,
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
      'INSERT INTO protocols (lab_id, title, protocol_type, phase, revisions_remaining) VALUES (?, ?, ?, ?, ?)',
      [req.labId, protocolTitle, protocol_type, 'input', 3]
    );

    // Populate sections from template
    const template = TEMPLATES[protocol_type];
    for (const section of template) {
      runSql(
        'INSERT INTO protocol_sections (protocol_id, section_key, section_title, section_order, guideline_text) VALUES (?, ?, ?, ?, ?)',
        [lastInsertRowid, section.key, section.title, section.order, section.guidelineText]
      );
    }

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

    const { title, status, phase } = req.body;
    if (title !== undefined) {
      runSql('UPDATE protocols SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        title, protocol.id,
      ]);
    }
    if (status !== undefined) {
      runSql('UPDATE protocols SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        status, protocol.id,
      ]);
    }
    if (phase !== undefined) {
      runSql('UPDATE protocols SET phase = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        phase, protocol.id,
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

// Update a section (content, status, and/or user_notes)
router.put('/:id/sections/:sectionId', (req, res) => {
  try {
    const protocol = queryOne('SELECT * FROM protocols WHERE id = ? AND lab_id = ?', [
      req.params.id, req.labId,
    ]);
    if (!protocol) return res.status(404).json({ error: 'Protocol not found' });

    const section = queryOne(
      'SELECT * FROM protocol_sections WHERE id = ? AND protocol_id = ?',
      [req.params.sectionId, protocol.id]
    );
    if (!section) return res.status(404).json({ error: 'Section not found' });

    const { content, status, user_notes } = req.body;
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
    if (user_notes !== undefined) {
      updates.push('user_notes = ?');
      params.push(user_notes);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(section.id);
      runSql(`UPDATE protocol_sections SET ${updates.join(', ')} WHERE id = ?`, params);
      runSql('UPDATE protocols SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [protocol.id]);
    }

    const updated = queryOne('SELECT * FROM protocol_sections WHERE id = ?', [section.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk generate full protocol from user notes (1 API call)
router.post('/:id/generate', async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({
        error: 'Anthropic API key not configured. Please set the ANTHROPIC_API_KEY environment variable.',
      });
    }

    const protocol = queryOne('SELECT * FROM protocols WHERE id = ? AND lab_id = ?', [
      req.params.id, req.labId,
    ]);
    if (!protocol) return res.status(404).json({ error: 'Protocol not found' });

    const sections = queryAll(
      'SELECT * FROM protocol_sections WHERE protocol_id = ? ORDER BY section_order',
      [protocol.id]
    );

    const typeInfo = PROTOCOL_TYPES[protocol.protocol_type];

    // Build the prompt with all sections and user notes
    let sectionPrompts = '';
    for (const s of sections) {
      const notes = s.user_notes && s.user_notes.trim()
        ? s.user_notes.trim()
        : 'No specific notes provided — generate reasonable placeholder content with [brackets] for details the researcher needs to fill in.';
      sectionPrompts += `\n=== SECTION: ${s.section_key} | ${s.section_title} ===\nGUIDELINE: ${s.guideline_text}\nRESEARCHER NOTES: ${notes}\n`;
    }

    const systemPrompt = `You are an expert research protocol writer. Generate a complete ${typeInfo.label} research protocol following ${typeInfo.guideline} guidelines.

The protocol is titled: "${protocol.title}"

Generate professional, detailed content for EVERY section. Use formal academic writing appropriate for ethics committee/IRB submission. Where the researcher has provided notes, incorporate them fully. Where no notes are given, write reasonable template content with [bracketed placeholders] for study-specific details.

CRITICAL: Return your response as a valid JSON object where each key is the section_key and the value is the generated content string for that section. Use \\n\\n for paragraph breaks within content. Do not wrap in markdown code blocks.`;

    const userMessage = `Generate content for all sections of this protocol:\n${sectionPrompts}\n\nReturn a JSON object with section keys as properties. Keys must exactly match: ${sections.map(s => s.section_key).join(', ')}`;

    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const responseText = message.content[0]?.text || '';

    // Parse JSON response — handle potential markdown wrapping
    let parsed;
    try {
      const cleaned = responseText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      return res.status(500).json({
        error: 'Failed to parse AI response. Please try again.',
        rawResponse: responseText.substring(0, 500),
      });
    }

    // Save generated content to each section
    for (const s of sections) {
      const generatedContent = parsed[s.section_key] || '';
      if (generatedContent) {
        runSql(
          'UPDATE protocol_sections SET content = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [generatedContent, 'complete', s.id]
        );
      }
    }

    // Update protocol phase
    runSql('UPDATE protocols SET phase = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      'generated', protocol.id,
    ]);

    // Return updated protocol
    const updatedSections = queryAll(
      'SELECT * FROM protocol_sections WHERE protocol_id = ? ORDER BY section_order',
      [protocol.id]
    );
    const updatedProtocol = queryOne('SELECT * FROM protocols WHERE id = ?', [protocol.id]);

    res.json({
      ...updatedProtocol,
      sections: updatedSections,
      typeLabel: typeInfo.label,
      guideline: typeInfo.guideline,
    });
  } catch (err) {
    if (err.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment and try again.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Revise protocol with feedback (max 3 times)
router.post('/:id/revise', async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({
        error: 'Anthropic API key not configured. Please set the ANTHROPIC_API_KEY environment variable.',
      });
    }

    const protocol = queryOne('SELECT * FROM protocols WHERE id = ? AND lab_id = ?', [
      req.params.id, req.labId,
    ]);
    if (!protocol) return res.status(404).json({ error: 'Protocol not found' });

    const remaining = protocol.revisions_remaining ?? 0;
    if (remaining <= 0) {
      return res.status(400).json({ error: 'No AI revisions remaining for this protocol. You can still edit sections manually.' });
    }

    const { feedback } = req.body;
    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ error: 'Please provide revision feedback.' });
    }

    const sections = queryAll(
      'SELECT * FROM protocol_sections WHERE protocol_id = ? ORDER BY section_order',
      [protocol.id]
    );

    const typeInfo = PROTOCOL_TYPES[protocol.protocol_type];

    // Build prompt with current content + revision feedback
    let currentContent = '';
    for (const s of sections) {
      currentContent += `\n=== SECTION: ${s.section_key} | ${s.section_title} ===\nCURRENT CONTENT:\n${s.content || '[empty]'}\nORIGINAL RESEARCHER NOTES: ${s.user_notes || 'none'}\n`;
    }

    const systemPrompt = `You are an expert research protocol writer revising a ${typeInfo.label} protocol following ${typeInfo.guideline} guidelines.

The protocol is titled: "${protocol.title}"

You will receive the current content of all sections plus revision feedback from the researcher. Apply the feedback to improve the protocol while maintaining consistency across all sections.

CRITICAL: Return your response as a valid JSON object where each key is the section_key and the value is the revised content string for that section. Use \\n\\n for paragraph breaks. Do not wrap in markdown code blocks.`;

    const userMessage = `Here is the current protocol:\n${currentContent}\n\nREVISION FEEDBACK FROM RESEARCHER:\n${feedback.trim()}\n\nPlease revise all sections incorporating this feedback. Return a JSON object with section keys. Keys must exactly match: ${sections.map(s => s.section_key).join(', ')}`;

    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const responseText = message.content[0]?.text || '';

    let parsed;
    try {
      const cleaned = responseText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      return res.status(500).json({
        error: 'Failed to parse AI response. Please try again.',
        rawResponse: responseText.substring(0, 500),
      });
    }

    // Save revised content
    for (const s of sections) {
      const revisedContent = parsed[s.section_key] || '';
      if (revisedContent) {
        runSql(
          'UPDATE protocol_sections SET content = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [revisedContent, 'complete', s.id]
        );
      }
    }

    // Decrement revisions
    const newRemaining = remaining - 1;
    runSql('UPDATE protocols SET revisions_remaining = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      newRemaining, protocol.id,
    ]);

    const updatedSections = queryAll(
      'SELECT * FROM protocol_sections WHERE protocol_id = ? ORDER BY section_order',
      [protocol.id]
    );
    const updatedProtocol = queryOne('SELECT * FROM protocols WHERE id = ?', [protocol.id]);

    res.json({
      ...updatedProtocol,
      sections: updatedSections,
      typeLabel: typeInfo.label,
      guideline: typeInfo.guideline,
      revisions_remaining: newRemaining,
    });
  } catch (err) {
    if (err.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment and try again.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Import a .docx template — parses and maps to section user_notes
router.post('/:id/import', async (req, res) => {
  try {
    const multer = require('multer');
    const mammoth = require('mammoth');
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }).single('file');

    upload(req, res, async (uploadErr) => {
      if (uploadErr) {
        return res.status(400).json({ error: 'File upload failed: ' + uploadErr.message });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Please upload a .docx file.' });
      }

      try {
        const protocol = queryOne('SELECT * FROM protocols WHERE id = ? AND lab_id = ?', [
          req.params.id, req.labId,
        ]);
        if (!protocol) return res.status(404).json({ error: 'Protocol not found' });

        // Extract text from docx
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        const documentText = result.value;

        if (!documentText || documentText.trim().length < 50) {
          return res.status(400).json({ error: 'Document appears to be empty or too short to parse.' });
        }

        const sections = queryAll(
          'SELECT * FROM protocol_sections WHERE protocol_id = ? ORDER BY section_order',
          [protocol.id]
        );

        const typeInfo = PROTOCOL_TYPES[protocol.protocol_type];

        if (!process.env.ANTHROPIC_API_KEY) {
          return res.status(503).json({
            error: 'Anthropic API key not configured. Please set the ANTHROPIC_API_KEY environment variable.',
          });
        }

        // Use LLM to map document content to sections
        const sectionList = sections.map(s => `- ${s.section_key}: ${s.section_title}`).join('\n');

        const systemPrompt = `You are an expert at parsing research protocol documents. You will receive the full text of an existing ${typeInfo.label} protocol document and a list of target sections following ${typeInfo.guideline} guidelines.

Your job is to map the content from the uploaded document to the appropriate sections. Extract the relevant content for each section.

CRITICAL: Return a valid JSON object where each key is the section_key and the value is the extracted text from the document that belongs in that section. If no matching content is found for a section, use an empty string. Do not wrap in markdown code blocks.`;

        const userMessage = `TARGET SECTIONS:\n${sectionList}\n\nDOCUMENT TEXT:\n${documentText.substring(0, 50000)}\n\nMap the document content to the sections above. Return a JSON object with section_key as properties.`;

        const Anthropic = require('@anthropic-ai/sdk');
        const client = new Anthropic();

        const message = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        });

        const responseText = message.content[0]?.text || '';

        let parsed;
        try {
          const cleaned = responseText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
          parsed = JSON.parse(cleaned);
        } catch (parseErr) {
          return res.status(500).json({
            error: 'Failed to parse the document. Please try again.',
          });
        }

        // Save parsed content as user_notes
        for (const s of sections) {
          const notes = parsed[s.section_key] || '';
          if (notes) {
            runSql(
              'UPDATE protocol_sections SET user_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [notes, s.id]
            );
          }
        }

        runSql('UPDATE protocols SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [protocol.id]);

        const updatedSections = queryAll(
          'SELECT * FROM protocol_sections WHERE protocol_id = ? ORDER BY section_order',
          [protocol.id]
        );

        res.json({
          success: true,
          sectionsWithNotes: updatedSections.filter(s => s.user_notes && s.user_notes.trim()).length,
          totalSections: updatedSections.length,
          sections: updatedSections,
        });
      } catch (innerErr) {
        if (innerErr.status === 429) {
          return res.status(429).json({ error: 'Rate limit exceeded. Please wait and try again.' });
        }
        res.status(500).json({ error: innerErr.message });
      }
    });
  } catch (err) {
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
    } = require('docx');

    const docChildren = [];

    // Title page
    docChildren.push(
      new Paragraph({ spacing: { before: 4000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({ text: protocol.title, bold: true, size: 48, font: 'Calibri' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({ text: `${typeInfo.label} Protocol`, size: 28, font: 'Calibri', color: '666666' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({ text: `Guideline: ${typeInfo.guideline}`, size: 24, font: 'Calibri', color: '888888', italics: true }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({ text: lab ? lab.lab_name : '', size: 24, font: 'Calibri' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `Generated: ${new Date().toLocaleDateString()}`, size: 22, font: 'Calibri', color: '999999' }),
        ],
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    // Table of Contents
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
        children: [new TextRun({ text: 'Table of Contents', bold: true, font: 'Calibri' })],
      })
    );

    sections.forEach((section, index) => {
      docChildren.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: `${index + 1}. ${section.section_title}`, size: 22, font: 'Calibri' }),
          ],
        })
      );
    });

    docChildren.push(new Paragraph({ children: [new PageBreak()] }));

    // Protocol sections
    sections.forEach((section, index) => {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          children: [
            new TextRun({ text: `${index + 1}. ${section.section_title}`, bold: true, font: 'Calibri' }),
          ],
        })
      );

      const content = section.content || '[This section has not been completed yet.]';
      const paragraphs = content.split('\n\n');

      for (const para of paragraphs) {
        if (para.trim()) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 200 },
              children: [new TextRun({ text: para.trim(), size: 22, font: 'Calibri' })],
            })
          );
        }
      }
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        children: docChildren,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = protocol.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
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
