import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'

interface ModalsContextValue {
  confirmationModalOpen: boolean
  setConfirmationModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  saveTestCaseModalOpen: boolean
  setSaveTestCaseModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  newTestCaseModalOpen: boolean
  setNewTestCaseModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  deleteTestCaseModalOpen: boolean
  setDeleteTestCaseModalOpen: React.Dispatch<React.SetStateAction<boolean>>

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

  modelProviderCrendentialsModalOpen: boolean
  setmodelProviderCrendentialsModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  editPairwiseResponseNameModalOpen: boolean
  setEditPairwiseResponseNameModalOpen: React.Dispatch<React.SetStateAction<boolean>>

  addCustomModelModalOpen: boolean
  setAddCustomModelModalOpen: React.Dispatch<React.SetStateAction<boolean>>
}
const ModalsContext = createContext<ModalsContextValue>({
  confirmationModalOpen: false,
  setConfirmationModalOpen: () => {},

  saveTestCaseModalOpen: false,
  setSaveTestCaseModalOpen: () => {},

  newTestCaseModalOpen: false,
  setNewTestCaseModalOpen: () => {},

  deleteTestCaseModalOpen: false,
  setDeleteTestCaseModalOpen: () => {},

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

  modelProviderCrendentialsModalOpen: false,
  setmodelProviderCrendentialsModalOpen: () => {},

  editPairwiseResponseNameModalOpen: false,
  setEditPairwiseResponseNameModalOpen: () => {},

  addCustomModelModalOpen: false,
  setAddCustomModelModalOpen: () => {},
})

export const useModalsContext = () => {
  return useContext(ModalsContext)
}

export const ModalsProvider = ({ children }: { children: ReactNode }) => {
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
  const [saveTestCaseModalOpen, setSaveTestCaseModalOpen] = useState(false)
  const [newTestCaseModalOpen, setNewTestCaseModalOpen] = useState(false)
  const [deleteTestCaseModalOpen, setDeleteTestCaseModalOpen] = useState(false)
  const [editNameModalOpen, setEditNameModalOpen] = useState(false)
  const [resultDetailsModalOpen, setResultDetailsModalOpen] = useState(false)
  const [evaluationRunningModalOpen, setEvaluationRunningModalOpen] = useState(false)
  const [promptModalOpen, setPromptModalOpen] = useState(false)
  const [syntheticGenerationModalOpen, setSyntheticGenerationModalOpen] = useState(false)
  const [sampleCodeTypeModalOpen, setSampleCodeTypeModalOpen] = useState(false)
  const [modelProviderCrendentialsModalOpen, setmodelProviderCrendentialsModalOpen] = useState(false)
  const [editPairwiseResponseNameModalOpen, setEditPairwiseResponseNameModalOpen] = useState(false)
  const [addCustomModelModalOpen, setAddCustomModelModalOpen] = useState(false)
  return (
    <ModalsContext.Provider
      value={{
        confirmationModalOpen,
        setConfirmationModalOpen,

        saveTestCaseModalOpen,
        setSaveTestCaseModalOpen,

        newTestCaseModalOpen,
        setNewTestCaseModalOpen,

        deleteTestCaseModalOpen,
        setDeleteTestCaseModalOpen,

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

        modelProviderCrendentialsModalOpen,
        setmodelProviderCrendentialsModalOpen,

        editPairwiseResponseNameModalOpen,
        setEditPairwiseResponseNameModalOpen,

        addCustomModelModalOpen,
        setAddCustomModelModalOpen,
      }}
    >
      {children}
    </ModalsContext.Provider>
  )
}
