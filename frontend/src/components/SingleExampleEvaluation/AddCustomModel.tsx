import { Button } from '@carbon/react'

import { useModalsContext } from '@providers/ModalsProvider'

export const AddCustomModel = () => {
  const { addCustomModelModalOpen, setAddCustomModelModalOpen } = useModalsContext()
  return (
    <div>
      <Button onClick={() => setAddCustomModelModalOpen(true)}>Add custom model</Button>
    </div>
  )
}
