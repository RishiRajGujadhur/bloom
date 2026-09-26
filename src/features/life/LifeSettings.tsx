import { lifeTools } from './catalog'
import { preference, updateLife, useLife } from './store'
import './life.css'
export function LifeSettings() {
  const { data, error } = useLife()
  return (
    <section className="life-settings">
      <h2>Life tools</h2>
      <p>
        Choose your tools and the details you want to see. Hidden fields keep
        their saved values.
      </p>
      {error && <p role="alert">{error}</p>}
      {lifeTools.map((tool) => {
        const prefs = preference(data, tool.id)
        const change = (value: Partial<typeof prefs>) =>
          updateLife((d) => ({
            ...d,
            preferences: {
              ...d.preferences,
              [tool.id]: { ...preference(d, tool.id), ...value },
            },
          }))
        return (
          <details key={tool.id}>
            <summary>
              {tool.name} · {tool.fields.length} options
            </summary>
            <p>{tool.description}</p>
            <label>
              <input
                type="checkbox"
                checked={prefs.enabled}
                onChange={(e) => change({ enabled: e.target.checked })}
              />{' '}
              Enable {tool.name}
            </label>
            <label>
              <input
                type="checkbox"
                checked={prefs.animate}
                onChange={(e) => change({ animate: e.target.checked })}
              />{' '}
              Animate the SVG summary
            </label>
            <div className="life-options">
              {tool.fields.map((field) => (
                <label key={field.key}>
                  <input
                    type="checkbox"
                    checked={!prefs.hidden.includes(field.key)}
                    onChange={(e) =>
                      change({
                        hidden: e.target.checked
                          ? prefs.hidden.filter((k) => k !== field.key)
                          : [...prefs.hidden, field.key],
                      })
                    }
                  />{' '}
                  {field.label}
                </label>
              ))}
            </div>
          </details>
        )
      })}
    </section>
  )
}
