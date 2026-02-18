/**
 * Global configuration for the Mess Manager application.
 * You can change the behavior of the application by modifying these values.
 */
export const MESS_CONFIG = {
    // The minimum number of meals every member must pay for each month.
    // Set this according to your mess rules.
    MIN_MEALS_PER_MONTH: 40,

    // Guest Meal Settings
    GUEST_CONFIG: {
        PRICES: {
            fish: 40,
            egg: 40,
            veg: 35,
            meat: 50
        },
        ICONS: {
            fish: '🐟',
            egg: '🥚',
            veg: '🥗',
            meat: '🍖'
        },
        LABELS: {
            fish: 'Fish',
            egg: 'Egg',
            veg: 'Veg',
            meat: 'Meat'
        }
    }

    // Other plan constants can be added here
};
