import { EditorProvider } from '@components/HighlightTextArea/EditorProvider'

import { AppSidebarProvider } from './Providers/AppSidebarProvider'
import { BackendUserProvider } from './Providers/BackendUserProvider'
import { CriteriasProvider } from './Providers/CriteriasProvider'
import { EvaluatorOptionsProvider } from './Providers/EvaluatorOptionsProvider'
import { URLParamsProvider } from './Providers/URLParamsProvider'
import { UserUseCasesProvider } from './Providers/UserUseCasesProvider'
import { SingleExampleEvaluation } from './SingleExampleEvaluation'

const Landing = () => (
  <BackendUserProvider>
    <CriteriasProvider>
      <EvaluatorOptionsProvider>
        <UserUseCasesProvider>
          <URLParamsProvider>
            <AppSidebarProvider>
              <EditorProvider>
                <SingleExampleEvaluation />
              </EditorProvider>
            </AppSidebarProvider>
          </URLParamsProvider>
        </UserUseCasesProvider>
      </EvaluatorOptionsProvider>
    </CriteriasProvider>
  </BackendUserProvider>
)

export default Landing
