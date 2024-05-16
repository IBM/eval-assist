import { Dispatch, SetStateAction } from 'react'

import { useRouter } from 'next/router'

import { Modal } from '@carbon/react'

import { UseCase } from '../types'

interface Props {
  setCurrentUseCase: (useCase: UseCase) => void
  selectedUseCase: UseCase | null
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  setSidebarTabSelected: Dispatch<SetStateAction<'user_use_cases' | 'library_use_cases' | null>>
}

export const SwitchUseCaseModal = ({
  open,
  setOpen,
  setCurrentUseCase,
  selectedUseCase,
  setSidebarTabSelected,
}: Props) => {
  const router = useRouter()

  return (
    selectedUseCase && (
      <Modal
        open={open}
        onRequestClose={() => setOpen(false)}
        modalHeading={`Start working with the '${selectedUseCase.name}' use case`}
        primaryButtonText="Confirm"
        secondaryButtonText="Cancel"
        shouldSubmitOnEnter
        onRequestSubmit={(e) => {
          setOpen(false)
          // setSidebarTabSelected(null)
          const promise =
            selectedUseCase.id !== null
              ? router.push({ pathname: '/', query: { id: selectedUseCase.id } }, `/?id=${selectedUseCase.id}`, {
                  shallow: true,
                })
              : router.push({ pathname: '/' }, `/`, { shallow: true })
          promise.then(() => {
            setCurrentUseCase(selectedUseCase)
          })
        }}
      >
        <p>{`This action will replace your ongoing work with the selected use case.`}</p>
      </Modal>
    )
  )
}
