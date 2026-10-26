/** Site-wide settings for 开兜 StarDou */
export const SITE = {
  name: '开兜',
  nameHant: '開兜',
  nameEn: 'StarDou',
  /** GitHub repo URL, shown on the home page and share dialog when set */
  repo: 'https://github.com/dou-project/stardou',
  /** accounts and the leaderboards; all hidden unless set at build time, see supabase/README.md */
  supabase: {
    url: import.meta.env?.VITE_SUPABASE_URL as string || '',
    anonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY as string || '',
  },
}
