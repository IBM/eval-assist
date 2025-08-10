import cx from 'classnames'
import { includes } from 'lodash'

import { useState } from 'react'

import { FileUploader } from '@carbon/react'

import { useParseFetchedTestCase } from '@customHooks/useParseFetchedTestCase'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'
import { useUserTestCasesContext } from '@providers/UserTestCasesProvider'
import { TestCase } from '@types'
import { readJsonFile } from '@utils'

interface Props {
  className?: string
}

export const TestCaseUpload = ({ className }: Props) => {
  const [file, setFile] = useState<File | null>(null)
  const { parseFetchedTestCase } = useParseFetchedTestCase()
  const { onSaveAs } = useTestCaseActionsContext()
  const { userTestCases } = useUserTestCasesContext()

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setFile(file)

    try {
      // Optionally specify the expected JSON structure with a custom type
      const uploadedTestCase = await readJsonFile(file)
      const parsedTestCase = parseFetchedTestCase(uploadedTestCase)
      parsedTestCase.id = null
      console.log(parsedTestCase)
      if (!parsedTestCase.name) {
        parsedTestCase.name = 'Untitled test case'
      }
      // set a name that is not reperated
      let i = 2
      const baseName = parsedTestCase.name
      let proposedName = baseName

      while (userTestCases.some((t) => t.name === proposedName)) {
        proposedName = `${baseName} ${i}`
        i += 1
      }
      parsedTestCase.name = proposedName
      onSaveAs(parsedTestCase.name, parsedTestCase)
    } catch (err) {
      console.error('Invalid JSON file:', err)
    } finally {
      setFile(null)
    }
  }

  const onDelete = () => {
    setFile(null)
  }

  return (
   
  )
}
