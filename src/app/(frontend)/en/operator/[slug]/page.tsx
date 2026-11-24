import { operatorPage } from '../../../_views/OperatorPage'

const page = operatorPage('en')
export const dynamicParams = false
export const generateStaticParams = page.generateStaticParams
export const generateMetadata = page.generateMetadata
export default page.Page
