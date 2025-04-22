import { EditorProvider } from '@components/HighlightTextArea/EditorProvider'

import { AppSidebarProvider } from './Providers/AppSidebarProvider'
import { BackendUserProvider } from './Providers/BackendUserProvider'
import { CriteriasProvider } from './Providers/CriteriasProvider'
import { PipelineTypesProvider } from './Providers/PipelineTypesProvider'
import { URLParamsProvider } from './Providers/URLParamsProvider'
import { UserUseCasesProvider } from './Providers/UserUseCasesProvider'
import { SingleExampleEvaluation } from './SingleExampleEvaluation'

const Landing = () => (
  <BackendUserProvider>
    <CriteriasProvider>
      <PipelineTypesProvider>
        <UserUseCasesProvider>
          <URLParamsProvider>
            <AppSidebarProvider>
              <EditorProvider>
                <SingleExampleEvaluation />
              </EditorProvider>
            </AppSidebarProvider>
          </URLParamsProvider>
        </UserUseCasesProvider>
      </PipelineTypesProvider>
    </CriteriasProvider>
  </BackendUserProvider>
)

export default Landing
