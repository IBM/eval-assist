// import { GetServerSideProps } from 'next'
// import Link from 'next/link'

// import { Column, FlexGrid, Row } from '@carbon/react'
// import { ArrowLeft } from '@carbon/react/icons'

// import { DataUpload } from '@components/Evaluation/DataUpload'
// import { Evaluation } from '@prisma/client'
// import { get } from '@utils/fetchUtils'

// interface Props {
//   evaluation: Evaluation
// }

// const EvaluationView = ({ evaluation }: Props) => {
//   return (
//     <>
//       <FlexGrid>
//         <Row>
//           <Column>
//             <Link href="/" style={{ textDecoration: 'none' }}>
//               <div style={{ display: 'flex' }}>
//                 <ArrowLeft /> <span style={{ paddingLeft: '10px' }}>{'Back to my evaluations'}</span>
//               </div>
//             </Link>
//           </Column>
//         </Row>
//         <Row>
//           <Column style={{ marginTop: '1.5rem' }}>
//             <div style={{ display: 'flex' }}>
//               <h2 style={{ color: 'gray', marginRight: '0.5rem' }}>{'1. Build: '}</h2>
//               <h2>{evaluation.name}</h2>
//             </div>
//           </Column>
//         </Row>
//         <Row>
//           <Column style={{ marginTop: '1.5rem', width: '100% !important' }}>
//             <DataUpload evaluation={evaluation} />
//           </Column>
//         </Row>
//       </FlexGrid>
//     </>
//   )
// }

// export const getServerSideProps = (async (context) => {
//   const evaluation: Evaluation = await (await get(`evaluation/${context.query.id}`)).json()
//   console.log(evaluation)
//   const result: Props = {
//     evaluation,
//   }

//   return { props: result }
// }) satisfies GetServerSideProps<Props>

const EvaluationView = () => {
  return null
}

export default EvaluationView
