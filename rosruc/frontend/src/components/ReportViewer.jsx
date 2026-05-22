function TextList({ title, items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="report-list">
      <h3>{title}</h3>
      <ul>
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ReportViewer({ report }) {
  return (
    <section className="result-block report-viewer">
      <div className="block-heading">
        <h2>Report Viewer</h2>
      </div>

      {report ? (
        <>
          <h3>{report.title}</h3>
          <p>{report.summary}</p>
          <TextList title="Reproduction Notes" items={report.reproductionNotes} />
          <TextList title="Test Notes" items={report.testNotes} />
          <TextList title="Next Steps" items={report.nextSteps} />
        </>
      ) : (
        <p>The agent draft report will appear here after a run.</p>
      )}
    </section>
  );
}
