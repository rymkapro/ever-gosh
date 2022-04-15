module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'gray-050a15': '#050a15',
                'gray-53596d': '#53596d',
                'gray-0a1124': '#0a1124',
                'gray-050a15': '#050a15',
                'gray-606060': '#606060',
                'gray-505050': '#505050',
                'gray-c4c4c4': '#c4c4c4',
                'gray-e8e8f5': '#e8e8f5',
                'red-dd3a3a': '#dd3a3a',

                'extblue': '#61a3ff',
            },
            fontFamily: {
                poppins: ['Poppins', 'sans-serif']
            },
            lineHeight: {
                '117%': '1.17'
            },
            spacing: {
                '18px': '1.125rem',
                '34px': '2.125rem',
                '51px': '3.1875rem',
                '72px': '4.5rem',
                '124px': '7.75rem'
            },
            borderRadius: {
                '3px': '0.1875rem',
                '5px': '0.3125rem',
                '21px': '1.3125rem'
            },
            opacity: {
                '1': '0.01',
                '3': '0.03',
                '7': '0.07',
                '15': '0.15',
                '65': '0.65'
            },
            maxWidth: {
                container: '1248px'
            },
            boxShadow: {
                'button': 'inset 1px 1px 1px rgba(10, 17, 36, 0.48)',
                'input': 'inset 1px 1px 1px rgba(232, 232, 245, 0.82)',
                'block': 'inset 1px 1px 1px rgba(10, 17, 36, 0.07)'
            },
            backdropBlur: {
                '33px': '33px'
            }
        },
    },
    plugins: [],
}
