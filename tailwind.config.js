module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            screens: {
                'under-sm': { 'raw': '(max-width: 639px)' },
            },
            colors: {
                'gray-050a15': '#050a15',
                'gray-53596d': '#53596d',
                'gray-0a1124': '#0a1124',
                'gray-050a15': '#050a15',
                'gray-606060': '#606060',
                'gray-505050': '#505050',
                'gray-c4c4c4': '#c4c4c4',
                'gray-e8e8f5': '#e8e8f5',
                'gray-e5e5f9': '#e5e5f9',
                'red-dd3a3a': '#dd3a3a',
                'red-f18888': '#f18888',
                'red-eb7979': '#eb7979',

                'extblue': '#61a3ff',
            },
            fontFamily: {
                body: ['Poppins', 'sans-serif']
            },
            fontSize: {
                '32px': '2rem',
            },
            lineHeight: {
                '32px': '2rem',
                '56px': '3.5rem'
            },
            spacing: {
                '18px': '1.125rem',
                '30px': '1.875rem',
                '34px': '2.125rem',
                '51px': '3.1875rem',
                '72px': '4.5rem',
                '124px': '7.75rem',
                '158px': '9.875rem'
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
                '12': '0.12',
                '15': '0.15',
                '29': '0.29',
                '65': '0.65',
                '82': '0.82'
            },
            boxShadow: {
                'button-header': 'inset 1px 1px 1px rgba(232, 232, 245, 0.44)',
                'button': 'inset 1px 1px 1px rgba(10, 17, 36, 0.48)',
                'input': 'inset 1px 1px 1px rgba(232, 232, 245, 0.82)',
                'input-error': 'inset 1px 1px 1px rgba(241, 136, 136, 0.82)',
                'block': 'inset 1px 1px 1px rgba(10, 17, 36, 0.07)'
            },
            backdropBlur: {
                '33px': '33px'
            }
        },
    },
    plugins: [],
}
