import { EditorProvider } from '@components/HighlightTextArea/EditorProvider'

import { AppSidebarProvider } from './Providers/AppSidebarProvider'
import { BackendUserProvider } from './Providers/BackendUserProvider'
import { PipelineTypesProvider } from './Providers/PipelineTypesProvider'
import { URLInfoProvider } from './Providers/URLInfoProvider'
import { UserUseCasesProvider } from './Providers/UserUseCasesProvider'
import { SingleExampleEvaluation } from './SingleExampleEvaluation'

const Landing = () => (
  <BackendUserProvider>
    <UserUseCasesProvider>
      <PipelineTypesProvider>
        <URLInfoProvider>
          <AppSidebarProvider>
            <EditorProvider>
              <SingleExampleEvaluation />
            </EditorProvider>
          </AppSidebarProvider>
        </URLInfoProvider>
      </PipelineTypesProvider>
    </UserUseCasesProvider>
  </BackendUserProvider>
)

export default Landing
