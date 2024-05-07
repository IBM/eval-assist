// import { Dispatch, SetStateAction } from 'react'

// import { Modal } from '@carbon/react'

// import { Evaluation } from '@prisma/client'

// interface Props {
//   open: boolean
//   setOpen: Dispatch<SetStateAction<boolean>>
//   evaluation: Evaluation | null
//   onDeleteEvaluation: (id: number) => void
// }

// export const ConfirmationDialog = ({ open, setOpen, evaluation, onDeleteEvaluation }: Props) => {
//   return (
//     evaluation && (
//       <Modal
//         modalHeading={`Delete ${evaluation.name}:`}
//         primaryButtonText="Delete"
//         secondaryButtonText="Cancel"
//         danger
//         open={open}
//         onRequestSubmit={(e) => onDeleteEvaluation(evaluation.id)}
//         onRequestClose={() => setOpen(false)}
//       >
//         <p
//           style={{
//             marginBottom: '1rem',
//           }}
//         >
//           {`Are you sure you want to delete evaluation '${evaluation.name}'?`}
//         </p>
//       </Modal>
//     )
//   )
// }
