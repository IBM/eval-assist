import { ChooseCodeGenerationType } from './Modals/ChooseCodeGenerationType'
import { DeleteUseCaseModal } from './Modals/DeleteUseCaseModal'
import { EditPairwiseResponseName } from './Modals/EditPairwiseResponseName'
import { EditTestCaseNameModal } from './Modals/EditTestCaseNameModal'
import { EvaluationRunningModal } from './Modals/EvaluationRunningModal'
import { InstanceDetailsModal } from './Modals/InstanceDetailsModal'
import { ModelProviderCredentialsModal } from './Modals/ModelProviderCredentialsModal'
import { NewUseCaseModal } from './Modals/NewUseCaseModal'
import { PromptModal } from './Modals/PromptModal'
import { SaveAsUseCaseModal } from './Modals/SaveAsUseCaseModal'
import { SwitchUseCaseModal } from './Modals/SwitchUseCaseModal'
import { SyntheticGenerationModal } from './Modals/SyntheticGenerationModal'
import { useCurrentTestCase } from './Providers/CurrentTestCaseProvider'
import { useModalsContext } from './Providers/ModalsProvider'

export const Modals = () => {
  const {
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
    modelProviderCrendentialsModalOpen,
    setmodelProviderCrendentialsModalOpen,
    editPairwiseResponseNameModalOpen,
    setEditPairwiseResponseNameModalOpen,
  } = useModalsContext()

  const { showingTestCase, changesDetected, updateURLFromTestCase } = useCurrentTestCase()

  return (
    <>
      <NewUseCaseModal
        open={newUseCaseModalOpen}
        setOpen={setNewUseCaseModalOpen}
        changesDetected={changesDetected}
        updateURLFromUseCase={updateURLFromTestCase}
      />
      {showingTestCase && (
        <>
          <SwitchUseCaseModal
            updateURLFromUseCase={updateURLFromTestCase}
            open={confirmationModalOpen}
            setOpen={setConfirmationModalOpen}
            setSaveUseCaseModalOpen={setSaveUseCaseModalOpen}
            setEvaluationRunningModalOpen={setEvaluationRunningModalOpen}
          />
          <SaveAsUseCaseModal open={saveUseCaseModalOpen} setOpen={setSaveUseCaseModalOpen} />

          <DeleteUseCaseModal open={deleteUseCaseModalOpen} setOpen={setDeleteUseCaseModalOpen} />
          <EditTestCaseNameModal open={editNameModalOpen} setOpen={setEditNameModalOpen} />
          <EvaluationRunningModal
            open={evaluationRunningModalOpen}
            setOpen={setEvaluationRunningModalOpen}
            updateURLFromUseCase={updateURLFromTestCase}
            setConfirmationModalOpen={setConfirmationModalOpen}
          />
          <InstanceDetailsModal open={resultDetailsModalOpen} setOpen={setResultDetailsModalOpen} />
          <PromptModal open={promptModalOpen} setOpen={setPromptModalOpen} />
          {syntheticGenerationModalOpen && (
            <SyntheticGenerationModal open={syntheticGenerationModalOpen} setOpen={setSyntheticGenerationModalOpen} />
          )}
          <ChooseCodeGenerationType open={sampleCodeTypeModalOpen} setOpen={setSampleCodeTypeModalOpen} />
          <ModelProviderCredentialsModal
            open={modelProviderCrendentialsModalOpen}
            setOpen={setmodelProviderCrendentialsModalOpen}
          />
          <EditPairwiseResponseName
            open={editPairwiseResponseNameModalOpen}
            setOpen={setEditPairwiseResponseNameModalOpen}
          />
        </>
      )}
    </>
  )
}
