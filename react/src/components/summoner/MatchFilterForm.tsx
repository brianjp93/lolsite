import {useEffect, useCallback, Fragment} from 'react'
import {useForm, SubmitHandler} from 'react-hook-form'
import queuefilter from '../../constants/queuefilter'

interface CustomWindow extends Window {
  $: any
}
declare let window: CustomWindow

export interface MatchFilterFormType {
  queue: number | string
  champion: string
  startDate: string
  endDate: string
  summoners: string
}
export function MatchFilterForm({onUpdate}: {onUpdate: (data?: MatchFilterFormType) => void}) {
  const form = useForm<MatchFilterFormType>()
  const {handleSubmit} = form
  const watchQueue = form.watch('queue')

  const onSubmit: SubmitHandler<MatchFilterFormType> = useCallback((data) => {
    onUpdate(data)
  }, [onUpdate])

  useEffect(() => {
    handleSubmit(onSubmit)()
  }, [watchQueue, handleSubmit, onSubmit])

  useEffect(() => {
    window.$('select').formSelect()
  }, [])

  return (

    <>
      <form>
        <div 
          style={{
            width:600,
          }} 
          className="input-field dark"
        >
          <select {...form.register('queue')}>
            <option value=''>any</option>
            {queuefilter.map((item) => {
              return (
                <Fragment key={item.id}>
                  <option value={item.id}>{item.name}</option>
                </Fragment>
              )
            })}
          </select>
          <label>Queue</label>
        </div>
      </form>
    </>
  )
}
