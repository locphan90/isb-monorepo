<template>
  <v-data-table
    :headers="computedHeaders"
    :items="items"
    item-value="RecID" item-key="RecID"  v-model:page="currentPage" class="elevation-1"
    density="comfortable"
    :hide-default-footer="!showFooter"
  >
    <template #item="{ item, index, toggleExpand, isExpanded }">
      <tr>
        <td v-if="nested" style="width: 40px; text-align: center;">
          <v-btn
            v-if="hasChildren(item)"
            icon
            size="small"
            variant="text"
            @click.stop="toggleRow(item.RecID)" >
            <v-icon>
              {{ expanded.includes(item.RecID)
                ? 'mdi-chevron-up'
                : 'mdi-chevron-down' }}
            </v-icon>
          </v-btn>
        </td>

        <td v-for="col in headers" :key="col.key" :class="{ 'text-right': col.needComma, 'text-left': !col.needComma }">
        <span v-if="col.title === '#'">
          {{ index + 1 }}
        </span>
          <slot
            v-else-if="col.key === 'actions'"
            name="actions"
            :item="item"
            :index="index"
          />
          <span v-else>{{ col.needComma ? formatNumber(item[col.key]) : item[col.key] }}</span>
        </td>
      </tr>

      <tr v-if="nested && expanded.includes(item.RecID) && hasChildren(item)">
        <td></td>
        <td :colspan="headers.length">
          <div class="child-wrapper">
            <v-data-table
              :headers="nestedHeaders"
              :items="item[nestedKey]"
              class="elevation-1 "
              :hide-default-footer="!childFooter"
              :items-per-page="50"
            >
              <template #headers>
                <tr>
                  <th
                    v-for="col in nestedHeaders"
                    :key="col.key"
                    class="text-blue"
                  >
                    {{ col.title }}
                  </th>
                </tr>
              </template>
              <template #item="{ item: child, index }">
                <tr>
                  <td v-for="col in nestedHeaders" :key="col.key" :class="{ 'text-blue text-center': col.needComma }">
                    <span v-if="col.title === '#'">
                      {{ index + 1 }}
                    </span>          
                    <slot
                      v-if="col.key === 'actions'"
                      name="child-actions"
                      :item="child"
                      :parent="item"
                    />
                    <span v-else>
                      {{ col.needComma ? formatNumber(child[col.key]) : child[col.key] }}
                    </span>
                  </td>
                </tr>
              </template>
              <template #item.actions="{ item: child, parent }">
                <slot name="child-actions" :item="child" :parent="parent" />
              </template>
            </v-data-table>
          </div>
        </td>
      </tr>
    </template>
  </v-data-table>
</template>

<script>
  export default {
    props: {
      headers: Array,
      items: Array,
      expanded: { type: Array, default: () => [] },
      nested: Boolean,
      nestedKey: String,
      nestedHeaders: Array,
      showFooter: Boolean,
      childFooter: Boolean
    },

    emits: ['update:expanded'],

    // ADDED: Internal state to keep track of the page
    data() {
      return {
        currentPage: 1
      }
    },

    computed: {
      computedHeaders() {
        return this.nested
          ? [{ title: '', key: 'expand' }, ...this.headers]
          : this.headers
      }
    },

    methods: {
      hasChildren(item) {
        const children = item[this.nestedKey]
        return Array.isArray(children) && children.length > 0
      },
      formatNumber(value) {
        if (value === null || value === undefined || value === "") return "";
        const num = Number(value);
        return isNaN(num) ? value : num.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2});
      },    
      toggleRow(recID) {
        const next = this.expanded.includes(recID)
          ? []
          : [recID]

        this.$emit('update:expanded', next)
      },
    }
  }
</script>

<style scoped>
.child-wrapper {
  margin-left: 2px; /* indent */
}

.text-blue {
  color: #1976d2;
}

:deep(.v-data-table-header__content) {
  color: #1976d2;
  justify-content: center;   /* ADD: header content is a flex span */
}
</style>