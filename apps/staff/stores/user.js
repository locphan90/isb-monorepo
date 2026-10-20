import { defineStore } from 'pinia'
import { arrDomain } from '~/utils/globals'

export const useUserStore = defineStore('user', () => {
  const supabase = useSupabase()
  const { user: sessionUser, clear } = useUserSession()

  const user = ref({
    email: '',
    name: '',
    rank: '',
    domain: '',
    domains: [],
    domainInfo: null, // holds full domain details including LogoISP.png
    rights: [],
    permissions: {},
    isLoggedIn: false
  })

  async function fetchUserProfile(email) {
    if (!email) {
      resetUser()
      return
    }

    try {
      const { data } = await supabase
        .from('tbl_misc')
        .select('user_role:obj_json, user_right:arr_json')
        .eq('cat', 'USERS')
        .ilike('val', email.trim())
        .maybeSingle()

      const role = data?.user_role || {}
      const isbApp = data?.user_right?.ISB_APP
      const rightsList = isbApp
        ? Object.entries(isbApp).filter(([, v]) => v === true).map(([k]) => k)
        : []

      // PERMISSIONS drives menu/button visibility via usePermission().canMenu/canButton
      const permissions = data?.user_right?.PERMISSIONS || {}

      const domainObj = arrDomain.find(d => d.domain === role.Domain.split(',')[0]) || null

      user.value = {
        email,
        name: role.Name || email.split('@')[0],
        rank: role.Rank || '',
        domain: role.Domain.split(',')[0],
        domains: role.Domain.split(','),
        domainInfo: domainObj,
        rights: rightsList,
        //thêm phần permissions để lấy quyền truy cập menu/button
        permissions,
        isLoggedIn: true
      }
    } catch (e){
      console.log (e.message)
      resetUser()
    }
  }

  function resetUser() {
    user.value = {
      email: '',
      name: '',
      rank: '',
      domain: '',
      domainInfo: null,
      rights: [],
      permissions: {},
      isLoggedIn: false
    }
  }

  async function logout() {
    await clear()
    resetUser()
    await navigateTo('/login')
  }

  const hasRight = (right) => right === null || user.value.rights.includes(right)

  watch(() => sessionUser.value?.email, (newEmail) => {
    fetchUserProfile(newEmail)
  }, { immediate: true })

  function setDomain(newDomain) {
    user.value.domain = newDomain
    user.value.domainInfo = arrDomain.find(d => d.domain === newDomain) || null
  }

  return {
    user,
    hasRight,
    logout,
    fetchUserProfile,
    setDomain
  }
})