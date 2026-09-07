export interface DayMeal {
    day: string, /// yyyyMMdd
    lunch: string,
    lunchUrl: string,
    dinner: string,
    dinnerUrl: string,
    editMode?: boolean
}