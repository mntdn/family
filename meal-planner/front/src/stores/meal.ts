import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { DayMeal } from '@/interfaces/DayMeal'
import {add, format} from 'date-fns'

export const useMealStore = defineStore('meal', () => {
  const meals = ref<DayMeal[]>([])
  const DAY_FORMAT = 'yyyyMMdd'

  function getMeals(): Promise<DayMeal[]> {
    const headers: Headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set('Accept', 'application/json')

    // Create the request object, which will be a RequestInfo type. 
    // Here, we will pass in the URL as well as the options object as parameters.
    const request: RequestInfo = new Request('http://localhost:3000/data', {
      method: 'GET',
      headers: headers
    })

    return fetch(request)
      .then(res => res.json())
      .then(res => {
        return res as DayMeal[]
      })

    // let start = new Date();
    // meals.value = [
    //   {
    //     day: format(add(start, {days:1}), DAY_FORMAT),
    //     lunch: 'Lettuce, Tom and cheese toasties',
    //     lunchUrl: '',
    //     dinner: 'Dahl and rice',
    //     dinnerUrl: 'https://www.bbc.co.uk/food/recipes/coconut_dahl_86921'
    //   },
    //   {
    //     day: format(add(start, {days:2}), DAY_FORMAT),
    //     lunch: 'Sandwiches',
    //     lunchUrl: '',
    //     dinner: 'Spag bol (double quantities)',
    //     dinnerUrl: 'https://www.bbcgoodfood.com/recipes/classic-bolognese'
    //   },
    //   {
    //     day: format(add(start, {days:3}), DAY_FORMAT),
    //     lunch: 'Sandwiches/toasties',
    //     lunchUrl: '',
    //     dinner: 'Stirfry + noodles',
    //     dinnerUrl: ''
    //   },
    //   {
    //     day: format(add(start, {days:4}), DAY_FORMAT),
    //     lunch: 'Salade (laitue, tomates cerises, concombre, olives, avocat, œuf dur, mozzarella et du pain)',
    //     lunchUrl: '',
    //     dinner: 'Omelette frites baked beans',
    //     dinnerUrl: ''
    //   },
    // ];
  }

  function sendUpdate(meal: DayMeal): Promise<void> {
    const headers: Headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set('Accept', 'application/json')

    const request: RequestInfo = new Request('http://localhost:3000/data', {
      // We need to set the `method` to `POST` and assign the headers
      method: 'POST',
      headers: headers,
      // Convert the user object to JSON and pass it as the body
      body: JSON.stringify(meal)
    })

    // Send the request and print the response
    return fetch(request)
      .then(res => {
        console.log("got response:", res)
      })
  }

  function setMeals(m: DayMeal[]) {
    meals.value = m;
  }

  function dispMeals() {
    console.log(meals.value.map(m => `${m.day}: ${m.lunch} -- ${m.dinner}`).join('\r\n'));
  }

  function updateMeal(mealToUpdate: DayMeal) {
    let m = meals.value.filter(_ => _.day == mealToUpdate.day);
    if(m && m[0] && m[0]?.day) {
      m[0].lunch = mealToUpdate.lunch;
      m[0].lunchUrl = mealToUpdate.lunchUrl;
      m[0].dinner = mealToUpdate.dinner;
      m[0].dinnerUrl = mealToUpdate.dinnerUrl;
    } else {
      meals.value.push(mealToUpdate);
    }
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

  return { meals, DAY_FORMAT, getMeals, setMeals, getForWeek, updateMeal, dispMeals, sendUpdate }
})
