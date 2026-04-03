const FLAGS = {
  DATA_EXPOSURE: 'CTF{4h_c3_f4m3ux_3ndp01nt_0ubl13}',
  IDOR: 'CTF{pr0f1l_v0l3_s4ns_4ut0r1s4t10n}',
  REFLECTED_XSS: 'CTF{r3ch3rch3_p13g33_p4r_l3_scr1pt}',
  SQLI: 'CTF{4dm1n_s4ns_m0t_d3_p4ss3}',
  BUSINESS_LOGIC: 'CTF{b4nqu13r_4ux_cr3d1ts_1nf1n1s}',
  JWT_FORGING: 'CTF{j3t0n_f0rg3_4cc3s_t0t4l}',
  STORED_XSS: 'CTF{4v1s_emp01s0nn3_p4g3_p13g33}',
};

const FLAG_NAMES = {
  [FLAGS.DATA_EXPOSURE]: 'Sensitive Data Exposure',
  [FLAGS.IDOR]: 'IDOR',
  [FLAGS.REFLECTED_XSS]: 'Reflected XSS',
  [FLAGS.SQLI]: 'SQL Injection',
  [FLAGS.BUSINESS_LOGIC]: 'Business Logic',
  [FLAGS.JWT_FORGING]: 'JWT Forging',
  [FLAGS.STORED_XSS]: 'Stored XSS',
};

const ALL_FLAGS = Object.values(FLAGS);

module.exports = { FLAGS, FLAG_NAMES, ALL_FLAGS };
