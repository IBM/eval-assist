import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'

interface ModalsContextValue {
  confirmationModalOpen: boolean
  setConfirmationModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  saveUseCaseModalOpen: boolean
  setSaveUseCaseModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  newUseCaseModalOpen: boolean
  setNewUseCaseModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  deleteUseCaseModalOpen: boolean
  setDeleteUseCaseModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  editNameModalOpen: boolean
  setEditNameModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  resultDetailsModalOpen: boolean
  setResultDetailsModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  evaluationRunningModalOpen: boolean
  setEvaluationRunningModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  promptModalOpen: boolean
  setPromptModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  syntheticGenerationModalOpen: boolean
  setSyntheticGenerationModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  sampleCodeTypeModalOpen: boolean
  setSampleCodeTypeModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  modelProviderCrendentialsModelOpen: boolean
  setModelProviderCrendentialsModelOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const ModalsContext = createContext<ModalsContextValue>({
  confirmationModalOpen: false,
  setConfirmationModalOpen: () => {},

  saveUseCaseModalOpen: false,
  setSaveUseCaseModalOpen: () => {},

  newUseCaseModalOpen: false,
  setNewUseCaseModalOpen: () => {},

  deleteUseCaseModalOpen: false,
  setDeleteUseCaseModalOpen: () => {},

  editNameModalOpen: false,
  setEditNameModalOpen: () => {},

  resultDetailsModalOpen: false,
  setResultDetailsModalOpen: () => {},

  evaluationRunningModalOpen: false,
  setEvaluationRunningModalOpen: () => {},

  promptModalOpen: false,
  setPromptModalOpen: () => {},

  syntheticGenerationModalOpen: false,
  setSyntheticGenerationModalOpen: () => {},

  sampleCodeTypeModalOpen: false,
  setSampleCodeTypeModalOpen: () => {},

  modelProviderCrendentialsModelOpen: false,
  setModelProviderCrendentialsModelOpen: () => {},
})

export const useModalsContext = () => {
  return useContext(ModalsContext)
}

export const ModalsProvider = ({ children }: { children: ReactNode }) => {
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
  const [saveUseCaseModalOpen, setSaveUseCaseModalOpen] = useState(false)
  const [newUseCaseModalOpen, setNewUseCaseModalOpen] = useState(false)
  const [deleteUseCaseModalOpen, setDeleteUseCaseModalOpen] = useState(false)
  const [editNameModalOpen, setEditNameModalOpen] = useState(false)
  const [resultDetailsModalOpen, setResultDetailsModalOpen] = useState(false)
  const [evaluationRunningModalOpen, setEvaluationRunningModalOpen] = useState(false)
  const [promptModalOpen, setPromptModalOpen] = useState(false)
  const [syntheticGenerationModalOpen, setSyntheticGenerationModalOpen] = useState(false)
  const [sampleCodeTypeModalOpen, setSampleCodeTypeModalOpen] = useState(false)
  const [modelProviderCrendentialsModelOpen, setModelProviderCrendentialsModelOpen] = useState(false)

  return (
    <ModalsContext.Provider
      value={{
        confirmationModalOpen,
        setConfirmationModalOpen,

        saveUseCaseModalOpen,
        setSaveUseCaseModalOpen,

        newUseCaseModalOpen,
        setNewUseCaseModalOpen,

        deleteUseCaseModalOpen,
        setDeleteUseCaseModalOpen,

        editNameModalOpen,
        setEditNameModalOpen,

        resultDetailsModalOpen,
        setResultDetailsModalOpen,

        evaluationRunningModalOpen,
        setEvaluationRunningModalOpen,

        promptModalOpen,
        setPromptModalOpen,

        syntheticGenerationModalOpen,
        setSyntheticGenerationModalOpen,

        sampleCodeTypeModalOpen,
        setSampleCodeTypeModalOpen,

        modelProviderCrendentialsModelOpen,
        setModelProviderCrendentialsModelOpen,
      }}
    >
      {children}
    </ModalsContext.Provider>
  )
}
