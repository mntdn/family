import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { DayMeal } from '@/interfaces/DayMeal'
import {add, format} from 'date-fns'

export const useMealStore = defineStore('meal', () => {
  const meals = ref<DayMeal[]>([])
  const DAY_FORMAT = 'yyyyMMdd'

  function getMeals() {
    let start = new Date();
    meals.value = [
      {
        day: format(add(start, {days:1}), DAY_FORMAT),
        lunch: 'Lettuce, Tom and cheese toasties',
        lunchUrl: '',
        dinner: 'Dahl and rice',
        dinnerUrl: 'https://www.bbc.co.uk/food/recipes/coconut_dahl_86921'
      },
      {
        day: format(add(start, {days:2}), DAY_FORMAT),
        lunch: 'Sandwiches',
        lunchUrl: '',
        dinner: 'Spag bol (double quantities)',
        dinnerUrl: 'https://www.bbcgoodfood.com/recipes/classic-bolognese'
      },
      {
        day: format(add(start, {days:3}), DAY_FORMAT),
        lunch: 'Sandwiches/toasties',
        lunchUrl: '',
        dinner: 'Stirfry + noodles',
        dinnerUrl: ''
      },
      {
        day: format(add(start, {days:4}), DAY_FORMAT),
        lunch: 'Salade (laitue, tomates cerises, concombre, olives, avocat, œuf dur, mozzarella et du pain)',
        lunchUrl: '',
        dinner: 'Omelette frites baked beans',
        dinnerUrl: ''
      },
    ];
  }

  function getForWeek(startDate: Date):DayMeal[] {
    let result: DayMeal[] = [];
    for(let i = 0; i < 7; i++) {
      let d = format(add(startDate, {days:i}), DAY_FORMAT);
      let curMeal = meals.value.filter(_ => _.day == d);
      result.push({
        day: d,
        lunch: curMeal[0]?.lunch ?? '',
        lunchUrl: curMeal[0]?.lunchUrl ?? '',
        dinner: curMeal[0]?.dinner ?? '',
        dinnerUrl: curMeal[0]?.dinnerUrl ?? '',
      })
    }
    return result;
  }

  return { meals, DAY_FORMAT, getMeals, getForWeek }
})
