const FLAGS = {
  DATA_EXPOSURE: 'ASY{4h_c3_f4m3ux_3ndp01nt_0ubl13}',
  IDOR: 'ASY{pr0f1l_v0l3_s4ns_4ut0r1s4t10n}',
  REFLECTED_XSS: 'ASY{r3ch3rch3_p13g33_p4r_l3_scr1pt}',
  SQLI: 'ASY{4dm1n_s4ns_m0t_d3_p4ss3}',
  BUSINESS_LOGIC: 'ASY{b4nqu13r_4ux_cr3d1ts_1nf1n1s}',
  JWT_FORGING: 'ASY{j3t0n_f0rg3_4cc3s_t0t4l}',
  STORED_XSS: 'ASY{4v1s_emp01s0nn3_p4g3_p13g33}',
  ZERO_RATING: 'ASY{z3r0_3t01l3s_v4l1d4t10n_byp4ss}',
};

const FLAG_NAMES = {
  [FLAGS.DATA_EXPOSURE]: 'Sensitive Data Exposure',
  [FLAGS.IDOR]: 'IDOR',
  [FLAGS.REFLECTED_XSS]: 'Reflected XSS',
  [FLAGS.SQLI]: 'SQL Injection',
  [FLAGS.BUSINESS_LOGIC]: 'Business Logic',
  [FLAGS.JWT_FORGING]: 'JWT Forging',
  [FLAGS.STORED_XSS]: 'Stored XSS',
  [FLAGS.ZERO_RATING]: 'Zero Rating',
};

const ALL_FLAGS = Object.values(FLAGS);

module.exports = { FLAGS, FLAG_NAMES, ALL_FLAGS };
