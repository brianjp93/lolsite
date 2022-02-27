export const fadeIn = async (elt: HTMLElement, time: number) => {
  let newOpacity = `0%`
  elt.style.opacity = newOpacity
  const time_per_changetime = time / 100
  for (let i = 1; i <= 100; i++) {
    await new Promise((r) => setTimeout(r, time_per_changetime))
    newOpacity = `${i}%`
    elt.style.opacity = newOpacity
  }
  elt.style.opacity = '100%'
}

export const fadeOut = async (elt: HTMLElement, time: number) => {
  elt.style.opacity = '100%'
  const time_per_changetime = time / 100
  let newOpacity = `${100}%`
  for (let i = 1; i <= 100; i++) {
    await new Promise((r) => setTimeout(r, time_per_changetime))
    newOpacity = `${100 - i}%`
    elt.style.opacity = newOpacity
  }
  elt.style.opacity = '0%'
}
