import { EditorProvider } from '@components/HighlightTextArea/EditorProvider'
import { AppSidebarProvider } from '@providers/AppSidebarProvider'
import { BackendUserProvider } from '@providers/BackendUserProvider'
import { CriteriasProvider } from '@providers/CriteriaProvider'
import { CurrentTestCaseProvider } from '@providers/CurrentTestCaseProvider'
import { EvaluatorOptionsProvider } from '@providers/EvaluatorOptionsProvider'
import { ModalsProvider } from '@providers/ModalsProvider'
import { ModelProviderCredentialsProvider } from '@providers/ModelProviderCredentialsProvider'
import { SelectedTextProvider } from '@providers/SelectedTextProvider'
import { SyntheticGenerationProvider } from '@providers/SyntheticGenerationProvider'
import { TestCaseActionsProvider } from '@providers/TestCaseActionsProvider'
import { URLParamsProvider } from '@providers/URLParamsProvider'
import { UserTestCasesProvider } from '@providers/UserTestCasesProvider'

import { SingleExampleEvaluation } from './SingleExampleEvaluation'

const Landing = () => (
  <BackendUserProvider>
    <CriteriasProvider>
      <EvaluatorOptionsProvider>
        <ModelProviderCredentialsProvider>
          <UserTestCasesProvider>
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
          </UserTestCasesProvider>
        </ModelProviderCredentialsProvider>
      </EvaluatorOptionsProvider>
    </CriteriasProvider>
  </BackendUserProvider>
)

export default Landing
