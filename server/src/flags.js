const FLAGS = {
  DATA_EXPOSURE: 'ASY{4h_c3_f4m3ux_3ndp01nt_0ubl13}',
  IDOR: 'ASY{pr0f1l_v0l3_s4ns_4ut0r1s4t10n}',
  REFLECTED_XSS: 'ASY{r3ch3rch3_p13g33_p4r_l3_scr1pt}',
  SQLI: 'ASY{4dm1n_s4ns_m0t_d3_p4ss3}',
  SQLI_UNION: 'ASY{un10n_s3l3ct_s3cr3ts_3xtr41ts}',
  BUSINESS_LOGIC: 'ASY{b4nqu13r_4ux_cr3d1ts_1nf1n1s}',
  JWT_FORGING: 'ASY{j3t0n_f0rg3_4cc3s_t0t4l}',
  STORED_XSS: 'ASY{4v1s_emp01s0nn3_p4g3_p13g33}',
  ZERO_RATING: 'ASY{z3r0_3t01l3s_v4l1d4t10n_byp4ss}',
  MASS_ASSIGNMENT: 'ASY{m4ss_4ss1gn_r0l3_4dm1n}',
};

const FLAG_NAMES = {
  [FLAGS.DATA_EXPOSURE]: 'Sensitive Data Exposure',
  [FLAGS.IDOR]: 'IDOR',
  [FLAGS.REFLECTED_XSS]: 'Reflected XSS',
  [FLAGS.SQLI]: 'SQL Injection (Login Bypass)',
  [FLAGS.SQLI_UNION]: 'SQL Injection (UNION)',
  [FLAGS.BUSINESS_LOGIC]: 'Business Logic',
  [FLAGS.JWT_FORGING]: 'JWT Forging',
  [FLAGS.STORED_XSS]: 'Stored XSS',
  [FLAGS.ZERO_RATING]: 'Zero Rating',
  [FLAGS.MASS_ASSIGNMENT]: 'Mass Assignment',
};

const FLAG_POINTS = {
  [FLAGS.DATA_EXPOSURE]: { points: 10, difficulty: 'Facile' },
  [FLAGS.IDOR]: { points: 10, difficulty: 'Facile' },
  [FLAGS.REFLECTED_XSS]: { points: 15, difficulty: 'Moyen' },
  [FLAGS.SQLI]: { points: 15, difficulty: 'Moyen' },
  [FLAGS.SQLI_UNION]: { points: 20, difficulty: 'Difficile' },
  [FLAGS.BUSINESS_LOGIC]: { points: 15, difficulty: 'Moyen' },
  [FLAGS.JWT_FORGING]: { points: 20, difficulty: 'Difficile' },
  [FLAGS.STORED_XSS]: { points: 20, difficulty: 'Difficile' },
  [FLAGS.ZERO_RATING]: { points: 15, difficulty: 'Moyen' },
  [FLAGS.MASS_ASSIGNMENT]: { points: 15, difficulty: 'Moyen' },
};

const ALL_FLAGS = Object.values(FLAGS);

module.exports = { FLAGS, FLAG_NAMES, FLAG_POINTS, ALL_FLAGS };
