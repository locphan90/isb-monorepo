// composables/usePivot.js
export function MyPivot(rows, { keys, value, pivot, colOrder = null, colSort = null, sortByKey = null }) {
    if (!rows?.length) return { columns: [], rows: [] }

    const rawCols = [...new Set(rows.map(r => r[pivot]))]
    const cols = colOrder
        ? colOrder.filter(c => rawCols.includes(c))
        : rawCols.sort(colSort ?? undefined)

    const map = {}
    rows.forEach(row => {
        const key = keys.map(k => row[k]).join('|')
        if (!map[key]) {
            map[key] = {
                ...Object.fromEntries(keys.map(k => [k, row[k]])),
                ...Object.fromEntries(cols.map(c => [c, 0])),
                Total: 0
            }
        }
        map[key][row[pivot]] += row[value]
        map[key].Total       += row[value]
    })

    const data = Object.values(map)
        .sort((a, b) => sortByKey ? a[sortByKey].localeCompare(b[sortByKey]) : 0)

    const totalRow = {
        ...Object.fromEntries(keys.map((k, i) => [k, i === 0 ? 'TOTAL' : null])),
        ...Object.fromEntries(cols.map(c => [c, 0])),
        Total: 0
    }
    data.forEach(row => {
        cols.forEach(c => totalRow[c] += row[c])
        totalRow.Total += row.Total
    })

    return { columns: cols, rows: [...data, totalRow] }
}