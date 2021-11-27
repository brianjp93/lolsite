import {useEffect} from 'react'
import {useForm, SubmitHandler} from 'react-hook-form'
import queuefilter from '../../constants/queuefilter'

interface CustomWindow extends Window {
  $: any
}
declare let window: CustomWindow

export interface MatchFilterFormType {
  queue: number
  champion: string
  startDate: string
  endDate: string
  summoners: string
}
export function MatchFilterForm({onUpdate}: {onUpdate: (data?: MatchFilterFormType) => void}) {
  const form = useForm<MatchFilterFormType>()
  const watchQueue = form.watch('queue')

  const handleSubmit: SubmitHandler<MatchFilterFormType> = (data) => {
    onUpdate(data)
  }

  useEffect(() => {
    form.handleSubmit(handleSubmit)()
  }, [watchQueue])

  useEffect(() => {
    window.$('select').formSelect()
  }, [])

  return (
    <>
      <form>
        <div className="input-field dark">
          <select {...form.register('queue')}>
            <option value="">any</option>
            {queuefilter.map((item) => {
              return (
                <>
                  <option value={item.id}>{item.name}</option>
                </>
              )
            })}
          </select>
          <label>Queue</label>
        </div>
      </form>
    </>
  )
}
