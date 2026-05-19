export type Task = {
  title: string;
  duration: number; // in minutes
  details: string;
};

export default function TaskList({ tasks, activeIndex }: { tasks: Task[], activeIndex: number }) {
  if (tasks.length === 0) return null;

  return (
    <div className="glass-panel">
      <h2>Your Action Plan</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Focus on one step at a time.
      </p>
      <ul className="task-list">
        {tasks.map((task, index) => (
          <li 
            key={index} 
            className={`task-item ${index === activeIndex ? 'active' : ''} ${index < activeIndex ? 'completed' : ''}`}
          >
            <div className="task-info">
              <h3>{index + 1}. {task.title}</h3>
              <p>{task.details}</p>
            </div>
            <div className="task-duration">
              {task.duration} min
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
