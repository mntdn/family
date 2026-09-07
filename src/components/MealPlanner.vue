<script setup lang="ts">
import type { DayMeal } from '@/interfaces/DayMeal'
import { useMealStore } from '@/stores/meal'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { format, parse } from 'date-fns'
import { Edit } from '@element-plus/icons-vue'

const mealStore = useMealStore()
const { meals } = storeToRefs(mealStore)

const curWeekMeals = ref<DayMeal[]>([])

const edit = (meal: DayMeal) => {
  console.log('EDIT', meal)
  meal.editMode = !(meal.editMode ?? false)
}

const formatDate = (d: string) => {
  return format(parse(d, mealStore.DAY_FORMAT, new Date()), 'EEE dd')
}

onMounted(() => {
  if (meals.value?.length == 0) {
    mealStore.getMeals()
    curWeekMeals.value = mealStore.getForWeek(new Date())
  }
})
</script>

<template>
  <div class="m-line header">
    <div class="m-col day">
      Day <button @click="console.log(curWeekMeals)">s</button>
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
      {{ formatDate(meal.day) }}<el-button type="primary" @click="edit(meal)" :icon="Edit" circle />
    </div>
    <div class="m-col">
      <template v-if="meal.editMode">
        <el-input v-model="meal.lunch" placeholder="lunch" clearable />
      </template>
      <template v-else>{{ meal.lunch }}</template>
    </div>
    <div label="Dinner" class="m-col">
      <template v-if="meal.editMode">
        <el-input v-model="meal.dinner" placeholder="dinner" clearable />
      </template>
      <template v-else>{{ meal.dinner }}</template>
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
.header .m-col {
  font-weight: bold;
  text-align: center;
}
.day {
  max-width: 120px;
}
</style>
