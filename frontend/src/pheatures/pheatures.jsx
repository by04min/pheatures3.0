import { useInventoryStore } from '../store/inventoryStore'

export default function Pheatures() {
  const { inventory } = useInventoryStore()

  return (
    <div>
      <pre className="text-xs text-gray-600">{JSON.stringify(inventory, null, 2)}</pre>
    </div>
  )
}
