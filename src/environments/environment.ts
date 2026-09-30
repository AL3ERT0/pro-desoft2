export const environment = {
  production: false,

  supabase: {
    url: 'https://vgmyadnozbmorwtpzenx.supabase.co',
    publishableKey: 'sb_publishable_XFLyFTai9gAgJ5HK30T3mw_vJrMHMis',
  },

  /**
   * Origen absoluto al que Supabase redirige tras un reset de contraseña.
   * Debe incluir el mismo `strategy` de routing que usa `provideRouter`.
   */
  passwordRecoveryRedirectTo: 'http://localhost:4200/#/reset-password',
};