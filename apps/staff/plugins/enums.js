import enumsAll from '~/enums'  // index.js default export

function enumToSelectItems(enumObj) {
  return Object.entries(enumObj).map(([key, value]) => ({
    text: key,
    value
  }))
}

export default defineNuxtPlugin(() => {
  const enums = {}

  for (const [name, enumObj] of Object.entries(enumsAll)) {
    enums[name] = enumObj                 // raw enum
    enums[`${name}Items`] = enumToSelectItems(enumObj) // for v-select
  }

  return {
    provide: {
      enums
    }
  }
})