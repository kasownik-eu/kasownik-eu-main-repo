import { cityPage } from '../../../_views/CityPage'

const page = cityPage('en')
export const dynamicParams = false
export const generateStaticParams = page.generateStaticParams
export const generateMetadata = page.generateMetadata
export default page.Page
