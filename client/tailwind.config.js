/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // 明亮欢快的配色方案
                primary: {
                    50: '#fef3e2',
                    100: '#fde4b9',
                    200: '#fcd38c',
                    300: '#fbc25f',
                    400: '#fab53d',
                    500: '#f9a825', // 金黄色主色
                    600: '#f69a1f',
                    700: '#f28917',
                    800: '#ee790f',
                    900: '#e85d00',
                },
                candy: {
                    pink: '#FF6B9D',
                    purple: '#C77DFF',
                    blue: '#6ECFFF',
                    green: '#7DFFB3',
                    yellow: '#FFE66D',
                    orange: '#FFA06D',
                    red: '#FF6B6B',
                },
            },
            fontFamily: {
                sans: ['PingFang SC', 'Microsoft YaHei', 'sans-serif'],
            },
            fontSize: {
                'display': ['2.5rem', { lineHeight: '1.2' }],
                'heading': ['1.75rem', { lineHeight: '1.3' }],
                'body-lg': ['1.25rem', { lineHeight: '1.6' }],
                'body': ['1.125rem', { lineHeight: '1.6' }],
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },
            boxShadow: {
                'soft': '0 4px 20px rgba(0, 0, 0, 0.08)',
                'card': '0 8px 30px rgba(0, 0, 0, 0.12)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
