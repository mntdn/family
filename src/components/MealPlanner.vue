<script setup lang="ts">
import type { DayMeal } from '@/interfaces/DayMeal'
import { useMealStore } from '@/stores/meal'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { format, parse, startOfWeek, endOfWeek, sub, add } from 'date-fns'
import { Edit, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const mealStore = useMealStore()
const { meals } = storeToRefs(mealStore)

const curWeekMeals = ref<DayMeal[]>([])
const curWeekStart = ref<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))

const edit = (meal: DayMeal) => {
  console.log('EDIT', meal)
  meal.editMode = !(meal.editMode ?? false);
  if(!meal.editMode)
    mealStore.updateMeal(meal);
}

const formatDateDay = (d: string) => {
  return format(parse(d, mealStore.DAY_FORMAT, new Date()), 'EEE dd')
}

const changeWeek = (goBack: boolean) => {
  curWeekStart.value = goBack ? sub(curWeekStart.value, {weeks:1}) : add(curWeekStart.value, {weeks:1});
  curWeekMeals.value = mealStore.getForWeek(curWeekStart.value)
}

const curDateTop = () => {
  return `${format(curWeekStart.value, 'EEE dd MMM')} -> ${format(endOfWeek(curWeekStart.value, { weekStartsOn: 1 }), 'EEE dd MMM')}`
}

onMounted(() => {
  if (meals.value?.length == 0) {
    mealStore.getMeals()
    curWeekMeals.value = mealStore.getForWeek(curWeekStart.value)
  }
})
</script>

<template>
  <div class="m-line top-line">
    <div class="m-col">
      <el-button type="primary" @click="changeWeek(true)" :icon="ArrowLeft" style="width: 100%" />
    </div>
    <div class="m-col">
       {{ curDateTop() }}
    </div>
    <div class="m-col">
      <el-button type="primary" @click="changeWeek(false)" :icon="ArrowRight" style="width: 100%" />
    </div>
  </div>
  <div class="m-line header">
    <div class="m-col day">
      Day <button @click="mealStore.dispMeals()">s</button>
    </div>
    <div class="m-col">
      Lunch
    </div>
    <div class="m-col">
      Dinner
    </div>
  </div>
  <div v-for="meal in curWeekMeals" class="m-line">
    <div class="m-col day">
      <el-button type="primary" @click="edit(meal)" :icon="Edit" circle />
      {{ formatDateDay(meal.day) }}
    </div>
    <div class="m-col">
      <template v-if="meal.editMode">
        <el-input v-model="meal.lunch" placeholder="lunch" clearable /><br />
        <el-input v-model="meal.lunchUrl" placeholder="link" clearable />
      </template>
      <template v-else>
        <template v-if="meal.lunchUrl && meal.lunchUrl.length > 4">
          <a :href="meal.lunchUrl" target="_blank">{{ meal.lunch }}</a>
        </template>
        <template v-else>
          {{ meal.lunch }}
        </template>
      </template>
    </div>
    <div label="Dinner" class="m-col">
      <template v-if="meal.editMode">
        <el-input v-model="meal.dinner" placeholder="dinner" clearable /><br />
        <el-input v-model="meal.dinnerUrl" placeholder="url" clearable />
      </template>
      <template v-else>
        <template v-if="meal.dinnerUrl && meal.dinnerUrl.length > 4">
          <a :href="meal.dinnerUrl" target="_blank">{{ meal.dinner }}</a>
        </template>
        <template v-else>
          {{ meal.dinner }}
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.m-line {
  display: flex;
  width: 100%;
}
.m-col {
  flex: 1;
}
.top-line{
  text-align: center;
}
.header .m-col {
  font-weight: bold;
  text-align: center;
}
.day {
  max-width: 120px;
}
</style>
