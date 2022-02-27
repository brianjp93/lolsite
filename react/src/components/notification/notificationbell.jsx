import { useEffect, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import ReactTooltip from 'react-tooltip'
import api from '../../api/api'

export function NotificationBell(props) {
    const [count, setCount] = useState(0)
    const theme = props.theme

    const getNotifications = useCallback(() => {
        const params = {
            is_grouped: true,
            count_only: true,
            is_read: false,
        }
        return api.notification.getNotifications(params).then(response => {
            if (count !== response.data.data) {
                setCount(response.data.data)
            }
        })
    }, [count])

    useEffect(() => {
      ReactTooltip.rebuild()
    }, [count])

    useEffect(() => {
        // check for new notifications every over some interval
        // defined below
        getNotifications()
        const interval = setInterval(() => {
            getNotifications()
        }, 1000 * 60 * 5)
        return () => clearInterval(interval)
    }, [getNotifications])

    let notifcolor = ''
    if (count > 0) {
        notifcolor = '#5592b7'
    }
    return (
        <>
            <Link to='/notifications/'>
                <div
                    style={{ display: 'flex', cursor: 'pointer' }}
                    data-tip={`You have ${count} new notification groups.`}
                    className={`input-field ${theme}`}
                >
                    <i style={{ color: notifcolor }} className="material-icons">
                        {count > 0 && 'notifications_active'}
                        {count === 0 && 'notifications'}
                    </i>
                    {count > 0 && (
                        <div
                            style={{
                                color: notifcolor,
                                display: 'inline-block',
                                padding: '0 8px',
                            }}
                        >
                            {count}
                        </div>
                    )}
                </div>
            </Link>
        </>
    )
}
