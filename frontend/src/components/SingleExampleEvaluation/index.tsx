import { EditorProvider } from '@components/HighlightTextArea/EditorProvider'

import { AppSidebarProvider } from './Providers/AppSidebarProvider'
import { BackendUserProvider } from './Providers/BackendUserProvider'
import { CriteriasProvider } from './Providers/CriteriasProvider'
import { CurrentTestCaseProvider } from './Providers/CurrentTestCaseProvider'
import { EvaluatorOptionsProvider } from './Providers/EvaluatorOptionsProvider'
import { ModalsProvider } from './Providers/ModalsProvider'
import { ModelProviderCredentialsProvider } from './Providers/ModelProviderCredentialsProvider'
import { SelectedTextProvider } from './Providers/SelectedTextProvider'
import { SyntheticGenerationProvider } from './Providers/SyntheticGenerationProvider'
import { TestCaseActionsProvider } from './Providers/TestCaseActionsProvider'
import { URLParamsProvider } from './Providers/URLParamsProvider'
import { UserUseCasesProvider } from './Providers/UserUseCasesProvider'
import { SingleExampleEvaluation } from './SingleExampleEvaluation'

const Landing = () => (
  <BackendUserProvider>
    <CriteriasProvider>
      <EvaluatorOptionsProvider>
        <ModelProviderCredentialsProvider>
          <UserUseCasesProvider>
            <URLParamsProvider>
              <CurrentTestCaseProvider>
                <TestCaseActionsProvider>
                  <ModalsProvider>
                    <SelectedTextProvider>
                      <SyntheticGenerationProvider>
                        <AppSidebarProvider>
                          <EditorProvider>
                            <SingleExampleEvaluation />
                          </EditorProvider>
                        </AppSidebarProvider>
                      </SyntheticGenerationProvider>
                    </SelectedTextProvider>
                  </ModalsProvider>
                </TestCaseActionsProvider>
              </CurrentTestCaseProvider>
            </URLParamsProvider>
          </UserUseCasesProvider>
        </ModelProviderCredentialsProvider>
      </EvaluatorOptionsProvider>
    </CriteriasProvider>
  </BackendUserProvider>
)

export default Landing
