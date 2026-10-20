
export const KNOWN_TESTS = ['IELTS', 'TOEFL IBT', 'TOEFL PBT', 'PTE', 'PEIC', 'Aptis BC'];

export const EXTRACTION_PROMPT =
  'This is an English-language certificate or test report (often a scan or photo of a paper copy). ' +
  'First identify which test it is (one of: ' + KNOWN_TESTS.join(', ') + '). Then extract, copying ' +
  'values EXACTLY as printed: the candidate family name and given name (as separate fields), gender, ' +
  'date of birth, the test date, every per-section/skill score printed on the document, the overall ' +
  'result (overall band, total score, and/or overall CEFR level), and the certificate/report reference ' +
  'number. Copy scores exactly as printed, including any "Retake" wording in a section name.';

// --- Claude / Anthropic: standard JSON Schema ---
export const CLAUDE_SCHEMA = {
  type: 'object',
  properties: {
    test_name: {
      type: 'string',
      enum: KNOWN_TESTS,
      description:
        'Which English certificate this document is. Must be exactly one of the listed values. ' +
        'IELTS = International English Language Testing System (0-9 bands). ' +
        'TOEFL IBT = TOEFL internet-based test (sections 0-30, total 0-120). ' +
        'TOEFL PBT = TOEFL paper-based test (total ~310-677). ' +
        'PTE = Pearson Test of English Academic (10-90). ' +
        'PEIC = Pearson English International Certificate (CEFR level based, e.g. Level 1/A2 ... Level 5/C1). ' +
        'Aptis BC = British Council Aptis (per-skill score plus CEFR level A1-C2).',
    },
    family_name: {
      type: 'string',
      description:
        'Family name (surname) in title case. Often printed in uppercase on the certificate, typically the first word for Vietnamese candidates (e.g., "TRAN" -> "Tran").',
    },
    given_name: {
      type: 'string',
      description:
        'Given name plus any middle names, in title case, space-separated in printed order after the family name (e.g., "DO PHUONG ANH" -> "Do Phuong Anh").',
    },
    gender: {
      enum: ['Male', 'Female', null],
      description:
        'Candidate sex/gender exactly as it appears on the certificate, normalized to "Male" or "Female". ' +
        'Some forms print "M"/"F" or "Sex: Male" — map those accordingly. Null if not shown on the document.',
    },
    date_of_birth: {
      type: ['string', 'null'],
      format: 'date',
      description:
        'Candidate date of birth in YYYY-MM-DD format. The printed format varies by test ' +
        '(e.g. DD/MM/YYYY on IELTS) — reformat to YYYY-MM-DD. Null if not shown on the document.',
    },
    test_date: {
      type: 'string',
      format: 'date',
      description: 'Date the test was taken, in YYYY-MM-DD format.',
    },
    sections: {
      type: 'array',
      description:
        'One entry per skill/section reported on the certificate. Use the section names exactly as printed ' +
        '(e.g. Listening, Reading, Writing, Speaking for IELTS/TOEFL; Listening, Reading, Speaking, Writing ' +
        'plus communicative/enabling skills for PTE; the per-skill rows for Aptis). Preserve any "Retake" ' +
        'wording in the name. Leave the array empty only if the certificate genuinely reports no per-section scores.',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Section/skill name as printed on the document, in title case.',
          },
          score: {
            type: 'string',
            description:
              'The score for this section, as a string so it can hold either a number (e.g. "7.5", "28") ' +
              'or a CEFR level (e.g. "B2"). Copy exactly what is printed.',
          },
        },
        required: ['name', 'score'],
        additionalProperties: false,
      },
    },
    overall_score: {
      type: 'string',
      description:
        'The overall result as a string: an overall band/total score where applicable (e.g. IELTS "7.0", ' +
        'TOEFL iBT "98", PTE "65") and/or the overall CEFR level where that is the headline result ' +
        '(e.g. PEIC/Aptis "B2"). Copy exactly what is printed as the headline result.',
    },
    cefr_level: {
      type: ['string', 'null'],
      description:
        'The overall CEFR level (A1, A2, B1, B2, C1, C2) if the certificate states one. Null if not shown.',
    },
    certificate_number: {
      type: 'string',
      description:
        'The unique identifier for this certificate: IELTS TRF (Test Report Form) number, ' +
        'TOEFL appointment/registration number, PTE score report / registration ID, or the equivalent ' +
        'reference number printed on the document. This is the key field used for downstream verification.',
    },
  },
  required: [
    'test_name', 'family_name', 'given_name', 'gender', 'date_of_birth',
    'test_date', 'sections', 'overall_score', 'cefr_level', 'certificate_number',
  ],
  additionalProperties: false,
};

// --- Gemini: OpenAPI-subset dialect (nullable:true, no null-in-enum, no additionalProperties) ---
export const GEMINI_SCHEMA = {
  type: 'object',
  properties: {
    test_name: {
      type: 'string',
      enum: KNOWN_TESTS,
      description:
        'Which English certificate this document is. Must be exactly one of the listed values. ' +
        'IELTS = 0-9 bands. TOEFL IBT = sections 0-30, total 0-120. TOEFL PBT = total ~310-677. ' +
        'PTE = 10-90. PEIC = CEFR level based. Aptis BC = per-skill score plus CEFR level A1-C2.',
    },
    family_name: {
      type: 'string',
      description:
        'Family name (surname) in title case. Often printed in uppercase, typically the first word ' +
        'for Vietnamese candidates (e.g. "TRAN" -> "Tran").',
    },
    given_name: {
      type: 'string',
      description:
        'Given name plus any middle names, in title case, space-separated in printed order ' +
        '(e.g. "DO PHUONG ANH" -> "Do Phuong Anh").',
    },
    gender: {
      type: 'string',
      nullable: true,
      enum: ['Male', 'Female'],
      description:
        'Candidate gender as printed, normalized to "Male" or "Female". Map "M"/"F" accordingly. Null if not shown.',
    },
    date_of_birth: {
      type: 'string',
      nullable: true,
      description: 'Date of birth in YYYY-MM-DD format. Reformat from the printed format. Null if not shown.',
    },
    test_date: {
      type: 'string',
      description: 'Date the test was taken, in YYYY-MM-DD format.',
    },
    sections: {
      type: 'array',
      description:
        'One entry per skill/section reported. Use section names exactly as printed, preserving any ' +
        '"Retake" wording. Empty only if the certificate genuinely reports no per-section scores.',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Section/skill name as printed, in title case.',
          },
          score: {
            type: 'string',
            description:
              'Score for this section as a string, holding a number (e.g. "7.5", "28") or a CEFR level ' +
              '(e.g. "B2"). Copy exactly what is printed.',
          },
        },
        required: ['name', 'score'],
      },
    },
    overall_score: {
      type: 'string',
      description:
        'Overall result as a string: overall band/total (e.g. IELTS "7.0", TOEFL iBT "98", PTE "65") ' +
        'and/or overall CEFR level (e.g. PEIC/Aptis "B2"). Copy the headline result exactly.',
    },
    cefr_level: {
      type: 'string',
      nullable: true,
      description: 'Overall CEFR level (A1-C2) if stated. Null if not shown.',
    },
    certificate_number: {
      type: 'string',
      description:
        'Unique identifier: IELTS TRF number, TOEFL appointment/registration number, PTE score report ID, ' +
        'or equivalent reference printed on the document. Key field for downstream verification.',
    },
  },
  required: [
    'test_name', 'family_name', 'given_name', 'gender', 'date_of_birth',
    'test_date', 'sections', 'overall_score', 'cefr_level', 'certificate_number',
  ],
};