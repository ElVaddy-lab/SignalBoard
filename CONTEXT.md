# SignalBoard

SignalBoard is a focused project-management workspace for tracking private projects, their progress, and the people responsible for them.

## Language

**User**:
A person who has a private set of projects in SignalBoard. A User's access is independent from the people named as responsible for individual projects.
_Avoid_: Member, teammate, project owner

**Project**:
A unit of work tracked through a defined lifecycle from planning to completion.
_Avoid_: Task, workspace, initiative

**Project Lead**:
The person named as responsible for a Project. A Project Lead is descriptive and does not imply a SignalBoard account or grant application access.
_Avoid_: Owner, member, assignee

**Project Activity**:
An immutable historical record of one successful action that created, materially changed, or deleted a Project. An update records which fields changed; status, priority, Deadline, and Project Lead changes retain their previous and new values, while a description change records only that it occurred. An update that changes Project Status is classified as Status Changed. A save with no effective changes creates no activity. Project Activity retains a Project title snapshot and remains part of the User's history after the Project itself is removed.
_Avoid_: Notification, message, current status

**Project Status**:
The current lifecycle phase of a Project: Planning, Active, Review, or Completed. A Project may move freely between phases as the work changes.
_Avoid_: Workflow gate, approval state

**Deadline**:
The optional calendar date by which a Project is intended to be completed. A Project may explicitly have no Deadline.
_Avoid_: Schedule, required due date

**Overdue Project**:
A Project whose Deadline has passed in the User's local calendar and whose current Project Status is not Completed.
_Avoid_: Late completion, upcoming deadline

**Upcoming Deadline**:
The Deadline of a non-completed Project when it falls between the User's current local calendar date and the following fourteen calendar days, inclusive. An Overdue Project is not upcoming.
_Avoid_: Overdue project, completed-project deadline

**Late Completion**:
A Project whose current Project Status is Completed and whose latest transition to Completed happened after its Deadline. A Project without a Deadline cannot be a Late Completion.
_Avoid_: Overdue project, delayed active project

**Late Completion Rate**:
The proportion of completed Projects with a Deadline that are Late Completions. Completed Projects without a Deadline are excluded from this measure.
_Avoid_: Overdue rate, completion rate

**Completion Rate**:
The proportion of current Projects whose Project Status is Completed. All current Projects are included in the denominator, whether or not they have a Deadline. When there are no Projects, the rate is undefined rather than zero.
_Avoid_: Late completion rate, completion-event count

**Completion Trend**:
The weekly count of transitions into Completed during the current and previous eleven ISO calendar weeks, evaluated in the User's local time zone. Each week begins on Monday and ends on Sunday regardless of Interface Language. Completing a reopened Project creates a new completion event in the trend.
_Avoid_: Current completed-project count, project creation trend

**Sample Project Set**:
A representative set of Projects that a User may explicitly add to an empty account to explore SignalBoard. The Projects become part of that User's private data and behave like ordinary Projects. Loading the set again restores missing sample Projects without duplicating existing ones.
_Avoid_: Automatic seed, global demo data
