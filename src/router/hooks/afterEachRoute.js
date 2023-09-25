import { inject } from 'vue'

export default async function afterEachRoute() {
  inject('tracking').page()
}
