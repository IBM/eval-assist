import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useModalsContext } from '@providers/ModalsProvider'

import { AddCustomModel } from './AddCustomModel'
import { AddCustomModelModal } from './Modals/AddCustomModelModal'
import { ChooseCodeGenerationType } from './Modals/ChooseCodeGenerationType'
import { DeleteTestCaseModal } from './Modals/DeleteTestCaseModal'
import { EditPairwiseResponseName } from './Modals/EditPairwiseResponseName'
import { EditTestCaseNameModal } from './Modals/EditTestCaseNameModal'
import { EvaluationRunningModal } from './Modals/EvaluationRunningModal'
import { InstanceDetailsModal } from './Modals/InstanceDetailsModal'
import { ModelProviderCredentialsModal } from './Modals/ModelProviderCredentialsModal'
import { NewTestCaseModal } from './Modals/NewTestCaseModal'
import { PromptModal } from './Modals/PromptModal'
import { SaveAsTestCaseModal } from './Modals/SaveAsTestCaseModal'
import { SwitchTestCaseModal } from './Modals/SwitchTestCaseModal'
import { SyntheticGenerationModal } from './Modals/SyntheticGenerationModal'

export const Modals = () => {
  const {
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
  } = useModalsContext()

  const { showingTestCase } = useCurrentTestCase()

  return (
    <>
      <NewTestCaseModal open={newTestCaseModalOpen} setOpen={setNewTestCaseModalOpen} />
      {showingTestCase && (
        <>
          <SwitchTestCaseModal
            open={confirmationModalOpen}
            setOpen={setConfirmationModalOpen}
            setSaveTestCaseModalOpen={setSaveTestCaseModalOpen}
            setEvaluationRunningModalOpen={setEvaluationRunningModalOpen}
          />
          <SaveAsTestCaseModal open={saveTestCaseModalOpen} setOpen={setSaveTestCaseModalOpen} />

          <DeleteTestCaseModal open={deleteTestCaseModalOpen} setOpen={setDeleteTestCaseModalOpen} />
          <EditTestCaseNameModal open={editNameModalOpen} setOpen={setEditNameModalOpen} />
          <EvaluationRunningModal open={evaluationRunningModalOpen} setOpen={setEvaluationRunningModalOpen} />
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
          <AddCustomModelModal open={addCustomModelModalOpen} setOpen={setAddCustomModelModalOpen} />
        </>
      )}
    </>
  )
}
