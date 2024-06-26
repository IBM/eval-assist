import * as fs from 'fs'
import * as path from 'path'

import { Benchmark } from '@utils/types'

const loadJSONFilesFromFolder = (folderPath: string): Benchmark[] => {
  const jsonObjects: Benchmark[] = []

  const fullFolderPath = process.cwd() + '/src/libraries/benchmarks/' + folderPath

  // Read all files in the folder
  const files = fs.readdirSync(fullFolderPath)

  // Loop through each file
  files.forEach((file) => {
    const filePath = path.join(fullFolderPath, file)

    // Check if the file has a .json extension
    if (path.extname(file) === '.json') {
      // Read the file content
      const fileContent = fs.readFileSync(filePath, 'utf8')

      // Parse the JSON content and push it to the array
      try {
        const jsonObject = JSON.parse(fileContent)
        jsonObjects.push(jsonObject)
      } catch (error) {
        console.error(`Error parsing JSON file ${file}:`, error)
      }
    }
  })

  return jsonObjects
}

export const benchmarkLibrary: Benchmark[] = [
  ...loadJSONFilesFromFolder('pairwise'),
  ...loadJSONFilesFromFolder('rubric'),
]
