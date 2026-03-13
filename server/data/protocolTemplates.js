// EQUATOR guideline-based protocol section templates
// Each protocol type maps to an array of sections with guideline context

const PROTOCOL_TYPES = {
  clinical_trial: {
    label: 'Clinical Trial',
    guideline: 'SPIRIT 2013',
    description: 'Interventional clinical trial protocol following SPIRIT guidelines',
  },
  observational: {
    label: 'Observational Study',
    guideline: 'STROBE',
    description: 'Prospective or cross-sectional observational study protocol',
  },
  retrospective: {
    label: 'Retrospective Observational Study',
    guideline: 'RECORD/STROBE',
    description: 'Observational study using routinely collected or retrospective data',
  },
  qualitative: {
    label: 'Qualitative Study',
    guideline: 'COREQ/SRQR',
    description: 'Qualitative research protocol following consolidated reporting criteria',
  },
};

const TEMPLATES = {
  clinical_trial: [
    {
      key: 'admin_title',
      title: 'Title and Trial Identification',
      order: 1,
      guidelineText: 'Provide a descriptive title, trial registration number (e.g., ClinicalTrials.gov identifier), and protocol version number with date. The title should identify the study as a randomized trial or other design.',
    },
    {
      key: 'admin_roles',
      title: 'Roles and Responsibilities',
      order: 2,
      guidelineText: 'List the names, affiliations, and roles of protocol contributors. Identify the sponsor, funding sources, and the role of each in study design, conduct, data analysis, and reporting.',
    },
    {
      key: 'admin_funding',
      title: 'Funding and Support',
      order: 3,
      guidelineText: 'Describe all sources of financial and material support. Include grant numbers, sponsor names, and any in-kind support. Describe the role of funders in study design, data collection, analysis, interpretation, and manuscript preparation.',
    },
    {
      key: 'intro_background',
      title: 'Background and Rationale',
      order: 4,
      guidelineText: 'Describe the scientific background and rationale for the trial. Include a summary of relevant prior research, existing knowledge gaps, and how this trial addresses them. Reference existing systematic reviews or meta-analyses where available.',
    },
    {
      key: 'intro_objectives',
      title: 'Objectives and Hypotheses',
      order: 5,
      guidelineText: 'State specific objectives and/or hypotheses. Clearly distinguish primary from secondary objectives. Objectives should be specific, measurable, and directly tied to the study design and outcomes.',
    },
    {
      key: 'methods_design',
      title: 'Study Design',
      order: 6,
      guidelineText: 'Describe the trial design (e.g., parallel, crossover, factorial, single-arm) including allocation ratio. Specify whether the study is superiority, equivalence, or non-inferiority. Include a schematic diagram of the study design if helpful.',
    },
    {
      key: 'methods_setting',
      title: 'Study Setting',
      order: 7,
      guidelineText: 'Describe the study settings (e.g., community clinic, academic hospital) and relevant dates, including periods of recruitment, follow-up, and data collection. For multicenter trials, describe site selection criteria.',
    },
    {
      key: 'methods_eligibility',
      title: 'Eligibility Criteria',
      order: 8,
      guidelineText: 'Define inclusion and exclusion criteria for participants. Criteria should be specific, measurable, and justified. Describe any run-in or washout periods. Explain criteria that may limit generalizability.',
    },
    {
      key: 'methods_interventions',
      title: 'Interventions',
      order: 9,
      guidelineText: 'Describe each intervention precisely, including control/comparator conditions. Include dosing, timing, route, duration, and any co-interventions. Describe criteria for modifying or discontinuing interventions. Use the TIDieR checklist for completeness.',
    },
    {
      key: 'methods_outcomes',
      title: 'Outcomes',
      order: 10,
      guidelineText: 'Define primary and secondary outcome measures. For each outcome, specify: the specific measurement variable, analysis metric, method of aggregation, and time point. Explain the clinical relevance of chosen outcomes.',
    },
    {
      key: 'methods_timeline',
      title: 'Participant Timeline',
      order: 11,
      guidelineText: 'Describe the schedule of enrollment, interventions, and assessments. Include a schedule of events table showing all study visits and procedures. Specify follow-up duration and the process for participant retention.',
    },
    {
      key: 'methods_sample_size',
      title: 'Sample Size',
      order: 12,
      guidelineText: 'Describe how the sample size was determined. Include the primary outcome, expected effect size, statistical test, significance level (alpha), power (1-beta), and any adjustments for attrition or multiple comparisons. Justify assumptions with references.',
    },
    {
      key: 'methods_recruitment',
      title: 'Recruitment',
      order: 13,
      guidelineText: 'Describe strategies for achieving adequate participant enrollment. Include recruitment sources, methods, and any incentives. Describe plans for monitoring recruitment and strategies if enrollment targets are not met.',
    },
    {
      key: 'methods_randomization',
      title: 'Randomization and Blinding',
      order: 14,
      guidelineText: 'Describe the method of generating the allocation sequence, the allocation concealment mechanism, and who will implement it. Specify who will be blinded (participants, care providers, outcome assessors, data analysts) and how blinding will be maintained. Describe any procedures for unblinding.',
    },
    {
      key: 'methods_data_collection',
      title: 'Data Collection Methods',
      order: 15,
      guidelineText: 'Describe data collection methods for each outcome, including who collects data, using what instruments/forms, and at what time points. Describe plans for promoting participant retention and complete follow-up. Describe plans for data quality assurance.',
    },
    {
      key: 'methods_data_management',
      title: 'Data Management Plan',
      order: 16,
      guidelineText: 'Describe plans for data entry, coding, security, and storage including any related processes to promote data quality. Specify the data management system (e.g., REDCap), data validation rules, audit trails, and backup procedures.',
    },
    {
      key: 'methods_statistics',
      title: 'Statistical Methods',
      order: 17,
      guidelineText: 'Describe the statistical methods for analyzing the primary and secondary outcomes. Include the analysis population (ITT, per-protocol), methods for handling missing data, planned sensitivity analyses, and any interim analyses. Specify statistical software.',
    },
    {
      key: 'ethics_consent',
      title: 'Ethics and Consent',
      order: 18,
      guidelineText: 'Describe plans for obtaining informed consent, including who will obtain consent and the process for ensuring understanding. Describe IRB/ethics committee approval status. Address any special considerations for vulnerable populations.',
    },
    {
      key: 'ethics_safety',
      title: 'Safety Monitoring and Adverse Events',
      order: 19,
      guidelineText: 'Describe plans for collecting, assessing, reporting, and managing adverse events and serious adverse events. Describe the composition and role of any Data Safety Monitoring Board (DSMB). Include stopping rules and any interim analysis plans for safety.',
    },
    {
      key: 'ethics_dissemination',
      title: 'Dissemination and Data Sharing',
      order: 20,
      guidelineText: 'Describe plans for communicating trial results to participants, healthcare professionals, and the public. Include plans for data sharing, publication policy, and authorship eligibility. Address any plans for making individual participant data available.',
    },
  ],

  observational: [
    {
      key: 'intro_background',
      title: 'Background and Rationale',
      order: 1,
      guidelineText: 'Explain the scientific background and rationale for the investigation. Describe the current state of knowledge, identify gaps, and explain how this study will contribute new understanding. Reference relevant prior research.',
    },
    {
      key: 'intro_objectives',
      title: 'Objectives',
      order: 2,
      guidelineText: 'State specific objectives, including any pre-specified hypotheses. Clearly define the primary and any secondary objectives. Objectives should directly inform the study design and analysis plan.',
    },
    {
      key: 'methods_design',
      title: 'Study Design',
      order: 3,
      guidelineText: 'Present key elements of study design (e.g., cohort, case-control, cross-sectional) early in the protocol. Describe the study type, direction of inquiry, and time frame. Justify why this design is appropriate for the objectives.',
    },
    {
      key: 'methods_setting',
      title: 'Setting',
      order: 4,
      guidelineText: 'Describe the setting, locations, and relevant dates including periods of recruitment, exposure, follow-up, and data collection. For multi-site studies, describe how sites were selected.',
    },
    {
      key: 'methods_participants',
      title: 'Participants',
      order: 5,
      guidelineText: 'Define eligibility criteria (inclusion and exclusion). Describe the sources and methods of participant selection. For matched studies, describe matching criteria and the number of matched participants per case. Describe methods of follow-up.',
    },
    {
      key: 'methods_variables',
      title: 'Variables',
      order: 6,
      guidelineText: 'Clearly define all outcomes, exposures, predictors, potential confounders, and effect modifiers. Provide operational definitions for each variable. Specify how variables are measured and categorized.',
    },
    {
      key: 'methods_data_sources',
      title: 'Data Sources and Measurement',
      order: 7,
      guidelineText: 'For each variable of interest, describe sources of data and details of methods of assessment/measurement. If applicable, describe comparability of assessment methods across groups. Describe any steps taken to validate data.',
    },
    {
      key: 'methods_bias',
      title: 'Bias',
      order: 8,
      guidelineText: 'Describe any efforts to address potential sources of bias. Consider selection bias, information bias, and confounding. Describe strategies to minimize these biases in the study design and analysis.',
    },
    {
      key: 'methods_study_size',
      title: 'Study Size',
      order: 9,
      guidelineText: 'Explain how the study size was determined. Include any sample size calculations, power analyses, or describe the available sample and whether it provides adequate precision. Justify assumptions.',
    },
    {
      key: 'methods_statistics',
      title: 'Statistical Methods',
      order: 10,
      guidelineText: 'Describe all statistical methods, including those used to control for confounding. Describe methods for examining subgroups, interactions, and sensitivity analyses. Explain how missing data will be addressed.',
    },
    {
      key: 'ethics_approvals',
      title: 'Ethics and Approvals',
      order: 11,
      guidelineText: 'Describe plans for ethical review and approval. Address informed consent procedures. Describe how participant confidentiality will be protected. Include data protection and privacy considerations.',
    },
    {
      key: 'dissemination',
      title: 'Funding and Dissemination',
      order: 12,
      guidelineText: 'Describe funding sources and their role in the study. Outline plans for dissemination of results, including target journals, conferences, and public reporting. Address potential conflicts of interest.',
    },
  ],

  retrospective: [
    {
      key: 'intro_background',
      title: 'Background and Rationale',
      order: 1,
      guidelineText: 'Explain the scientific background and rationale for the study. Describe the current state of knowledge and how this retrospective analysis will contribute. Justify the use of existing/routinely collected data for addressing the research question.',
    },
    {
      key: 'intro_objectives',
      title: 'Objectives',
      order: 2,
      guidelineText: 'State specific objectives and any pre-specified hypotheses. Clarify whether the study is exploratory or confirmatory. Objectives should be achievable with the available retrospective data.',
    },
    {
      key: 'methods_design',
      title: 'Study Design',
      order: 3,
      guidelineText: 'Present the study design (retrospective cohort, case-control, cross-sectional). Describe the time frame and any key design features. Justify why a retrospective approach is appropriate.',
    },
    {
      key: 'methods_setting',
      title: 'Setting and Context',
      order: 4,
      guidelineText: 'Describe the setting and relevant dates. Describe the healthcare system or context in which the data were generated. Explain any changes in practice patterns or data collection during the study period that could affect results.',
    },
    {
      key: 'methods_data_source',
      title: 'Database and Data Source Description',
      order: 5,
      guidelineText: 'RECORD item: Describe the data source(s) in detail, including the purpose for which the database was created, the population it covers, the data collected, and any validation studies. Describe how the database is maintained and updated.',
    },
    {
      key: 'methods_participants',
      title: 'Participants and Cohort Selection',
      order: 6,
      guidelineText: 'Define eligibility criteria for inclusion from the database. Describe the process of selecting participants from the data source. Report the number of individuals at each stage of selection. Describe any matching criteria.',
    },
    {
      key: 'methods_variables',
      title: 'Variables and Definitions',
      order: 7,
      guidelineText: 'Define all outcomes, exposures, predictors, confounders, and effect modifiers. Provide operational definitions including any diagnostic codes (ICD, CPT, etc.) or algorithms used to identify them in the database.',
    },
    {
      key: 'methods_code_lists',
      title: 'Code Lists and Algorithms',
      order: 8,
      guidelineText: 'RECORD item: Provide the complete list of codes and algorithms used to identify exposures, outcomes, confounders, and other variables from the database. Describe any validation of these code lists. Include code lists in an appendix if extensive.',
    },
    {
      key: 'methods_data_cleaning',
      title: 'Data Cleaning and Quality',
      order: 9,
      guidelineText: 'RECORD item: Describe the data cleaning procedures. Report the extent of missing data for each variable. Describe any data quality checks performed. Explain how data inconsistencies were resolved.',
    },
    {
      key: 'methods_linkage',
      title: 'Data Linkage',
      order: 10,
      guidelineText: 'RECORD item: If multiple data sources are linked, describe the linkage methods, linkage variables, and linkage quality (e.g., match rate). Describe how linkage errors might affect results. Address privacy protections in the linkage process.',
    },
    {
      key: 'methods_bias',
      title: 'Bias and Limitations of Data',
      order: 11,
      guidelineText: 'Describe potential biases specific to using retrospective/routinely collected data, including misclassification, unmeasured confounding, and information bias. Describe strategies to address these limitations.',
    },
    {
      key: 'methods_study_size',
      title: 'Study Size',
      order: 12,
      guidelineText: 'Explain how the study size was determined. If using the full available database, describe the number of eligible records and any power considerations. Justify whether the available data provide adequate precision.',
    },
    {
      key: 'methods_statistics',
      title: 'Statistical Methods',
      order: 13,
      guidelineText: 'Describe all statistical methods including those for controlling confounding. Address methods for handling missing data, sensitivity analyses, and subgroup analyses. Specify software to be used.',
    },
    {
      key: 'ethics_governance',
      title: 'Ethics, Governance, and Data Access',
      order: 14,
      guidelineText: 'Describe ethical approvals, data governance requirements, and data access agreements. Address whether informed consent was obtained or waived. Describe how patient confidentiality is maintained when using administrative data.',
    },
  ],

  qualitative: [
    {
      key: 'team_characteristics',
      title: 'Research Team and Reflexivity',
      order: 1,
      guidelineText: 'Describe the research team members, their credentials, experience, and training in qualitative methods. Describe the relationship between researcher(s) and participants prior to study commencement. Address researcher assumptions, biases, and how they may influence the research.',
    },
    {
      key: 'theoretical_framework',
      title: 'Theoretical Framework and Methodology',
      order: 2,
      guidelineText: 'Identify the methodological orientation underpinning the study (e.g., grounded theory, phenomenology, ethnography, narrative inquiry, thematic analysis). Justify the choice of methodology. Describe the philosophical or theoretical assumptions.',
    },
    {
      key: 'participant_selection',
      title: 'Participant Selection',
      order: 3,
      guidelineText: 'Describe the sampling strategy (e.g., purposive, snowball, theoretical, maximum variation). Define inclusion criteria. Describe how participants will be approached and recruited. Specify the planned sample size or the criteria for data saturation.',
    },
    {
      key: 'study_setting',
      title: 'Study Setting and Context',
      order: 4,
      guidelineText: 'Describe the setting in which the research will be conducted. Provide relevant contextual information about the participants and their environment. Describe any relationship between the setting and the research question.',
    },
    {
      key: 'data_collection',
      title: 'Data Collection',
      order: 5,
      guidelineText: 'Describe the data collection method(s) (e.g., semi-structured interviews, focus groups, observation, document analysis). Include the interview guide or topic list. Describe recording methods, field notes, and duration of data collection. Explain if and how the data collection methods were modified during the study.',
    },
    {
      key: 'data_collection_instruments',
      title: 'Interview Guide or Topic Framework',
      order: 6,
      guidelineText: 'Provide the interview guide, topic guide, or observation framework. Describe how questions were developed and whether pilot testing was performed. Include prompts and follow-up questions. Explain the theoretical basis for the questions.',
    },
    {
      key: 'data_analysis',
      title: 'Data Analysis',
      order: 7,
      guidelineText: 'Describe the analytical approach (e.g., thematic analysis, framework analysis, grounded theory coding, interpretive phenomenological analysis). Describe the coding process: who coded, how themes were derived, whether software was used (e.g., NVivo). Describe how the codebook was developed.',
    },
    {
      key: 'trustworthiness',
      title: 'Trustworthiness and Rigor',
      order: 8,
      guidelineText: 'Describe strategies to ensure trustworthiness and rigor. Address credibility (e.g., member checking, triangulation, peer debriefing), transferability (thick description), dependability (audit trail), and confirmability (reflexivity). Describe any participant validation.',
    },
    {
      key: 'ethics',
      title: 'Ethical Considerations',
      order: 9,
      guidelineText: 'Describe ethical review and approval. Address informed consent procedures specific to qualitative research (ongoing consent, right to withdraw). Describe how confidentiality and anonymity will be maintained, especially with direct quotations and small samples.',
    },
    {
      key: 'dissemination',
      title: 'Dissemination and Reporting Plan',
      order: 10,
      guidelineText: 'Describe plans for reporting findings, including how quotations will be used and attributed. Address plans for participant feedback on findings. Describe the intended audience and dissemination strategy.',
    },
  ],
};

module.exports = { PROTOCOL_TYPES, TEMPLATES };
