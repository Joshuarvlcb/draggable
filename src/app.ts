//* Drag & Drop Interfaces
interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

//* Project Type
//* defines what the project will look like
enum ProjectStatus {
  Active,
  Finished,
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

//*Project State Mangement
type Listener<T> = (items: T[]) => void;

class State<T> {
  protected listeners: Listener<T>[] = [];
  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }
}

class ProjectState extends State<Project> {
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {
    super();
  }
  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }
  addProject(title: string, description: string, people: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      people,
      ProjectStatus.Active
    );
    this.projects.push(newProject);
  }

  moveProject(projectID: string, newStatus: ProjectStatus) {
    const project = this.projects.find((current) => {
      current.id === projectID;
    });
    if (project && project.status !== newStatus) {
      project.status = newStatus;
      this.updateListeners();
    }
  }
  private updateListeners() {
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice());
    }
  }
}

const projectState = ProjectState.getInstance();

//* Validation

interface Validatable {
  value: string | number;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  max?: number;
  min?: number;
}

function validate(input: Validatable) {
  let isValid = true;
  if (input.required) {
    isValid = isValid && input.value.toString().trim().length !== 0;
  }
  if (input.minLength != null && typeof input.value === "string") {
    isValid = isValid && input.value.length >= input.minLength;
  }
  if (input.maxLength != null && typeof input.value === "string") {
    isValid = isValid && input.value.length <= input.maxLength;
  }
  if (input.min != null && typeof input.value === "number") {
    isValid = isValid && +input.value <= input.min;
  }
  if (input.max != null && typeof input.value === "number") {
    isValid = isValid && +input.value <= input.max;
  }
  return isValid;
}

function Autobind(_: any, _2: any, desc: PropertyDescriptor) {
  const originalMethod = desc.value;
  const newMethod: PropertyDescriptor = {
    get() {
      return originalMethod.bind(this);
    },
  };
  return newMethod;
}

class ProjectInput {
  template: HTMLTemplateElement;
  hostEl: HTMLElement;
  formEl: HTMLFormElement;
  titleInput: HTMLInputElement;
  descInput: HTMLInputElement;
  peopleInput: HTMLInputElement;

  constructor() {
    this.template = document.getElementById(
      "project-input"
    ) as HTMLTemplateElement;

    this.hostEl = document.getElementById("app") as HTMLElement;
    const importedTemplate = document.importNode(this.template.content, true);
    this.formEl = importedTemplate.firstElementChild as HTMLFormElement;
    this.formEl.id = "user-input";

    this.titleInput = this.formEl.querySelector("#title") as HTMLInputElement;
    this.descInput = this.formEl.querySelector(
      "#description"
    ) as HTMLInputElement;
    this.peopleInput = this.formEl.querySelector("#people") as HTMLInputElement;
    this.init();
    this.attach();
  }
  private init() {
    this.formEl.addEventListener("submit", this.submitHandler.bind(this));
  }

  //! private because it will only be used by the class you cant access it outside of the class
  private attach() {
    this.hostEl.insertAdjacentElement("afterbegin", this.formEl);
  }
  // @Autobind
  private submitHandler(e: Event) {
    e.preventDefault();
    const userInputs = this.gatherUserInputs();

    if (userInputs) {
      const [title, desc, people] = userInputs;
      projectState.addProject(title, desc, people);
      this.clearInput();
    }
  }

  private clearInput() {
    this.titleInput.value = "";
    this.descInput.value = "";
    this.peopleInput.value = "";
  }

  private gatherUserInputs(): [string, string, number] | void {
    const userTitle = this.titleInput.value;
    const userDesc = this.descInput.value;
    const userPeople = +this.peopleInput.value;

    const titleIsValid: Validatable = {
      value: userTitle,
      required: true,
    };
    const descIsValid: Validatable = {
      value: userDesc,
      required: true,
      minLength: 2,
    };

    const peopleIsValid: Validatable = {
      value: userPeople,
      required: true,
      min: 1,
      max: 5,
    };
    if (
      !validate(titleIsValid) ||
      !validate(descIsValid) ||
      !validate(peopleIsValid)
    ) {
      return console.log("something is wrong please fix");
    }

    if (!userTitle || !userDesc || !userPeople)
      return console.log("something is blank please fill it in");

    return [userTitle, userDesc, +userPeople];
  }
}

class ProjectItem {
  project: Project;
  templateEl: HTMLTemplateElement;
  hostEl: HTMLElement;
  element: HTMLElement;
  constructor(project: Project, private hostId: string) {
    console.log("hi");
    this.project = project;
    this.templateEl = document.getElementById(
      "single-project"
    ) as HTMLTemplateElement;
    this.hostEl = document.getElementById(this.hostId) as HTMLElement;

    const importedTemplate = document.importNode(this.templateEl.content, true);
    this.element = importedTemplate.querySelector("section") as HTMLElement;
    this.element.id = `${this.project.id}`;
    this.attach();
    this.init();
    this.render();
  }
  @Autobind
  dragEndHandler(_: DragEvent): void {
    console.log("Dragend");
  }

  @Autobind
  dragStartHandler(e: DragEvent): void {
    e.dataTransfer!.setData("text/plain", this.project.id);
    e.dataTransfer!.effectAllowed = "move";
  }

  get persons() {
    if (this.project.people === 1) {
      return "1 person";
    } else {
      return `${this.project.people} people`;
    }
  }

  init() {
    this.element.addEventListener("dragstart", this.dragStartHandler);
    this.element.addEventListener("dragend", this.dragEndHandler);
  }

  private render() {
    this.element.querySelector("h2")!.textContent = this.project.title;
    this.element.querySelector("h3")!.textContent = this.persons + "assigned";
    this.element.querySelector("p")!.textContent = this.project.description;
  }
  private attach() {
    this.hostEl.insertAdjacentElement("beforeend", this.element);
  }
}

class ProjectList implements DragTarget {
  templateEl: HTMLTemplateElement;
  hostEl: HTMLElement;
  element: HTMLElement;
  assignedProjects: Project[];

  constructor(private type: "active" | "finished") {
    this.assignedProjects = [];
    this.templateEl = document.getElementById(
      "project-list"
    ) as HTMLTemplateElement;
    this.hostEl = document.getElementById("app") as HTMLElement;

    const importedTemplate = document.importNode(this.templateEl.content, true);
    this.element = importedTemplate.querySelector("section") as HTMLElement;
    this.element.id = `${type}-projects`;
    this.attach();
    this.init();
    this.renderContent();
  }
  private init() {
    this.element.addEventListener("dragover", this.dragOverHandler);
    this.element.addEventListener("dragleave", this.dragLeaveHandler);
    this.element.addEventListener("drop", this.dropHandler);

    projectState.addListener((projects: Project[]) => {
      const revelantProjects = projects.filter((prj) => {
        if (this.type === "active") {
          return prj.status === ProjectStatus.Active;
        }
        return prj.status === ProjectStatus.Active;
      });
      this.assignedProjects = revelantProjects;
      this.renderProjects();
    });
  }

  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-projects-list`
    ) as HTMLUListElement;
    listEl.innerHTML = "";
    for (const projectItem of this.assignedProjects) {
      new ProjectItem(projectItem, this.element.querySelector("ul")!.id);
    }
  }

  private renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " Projects";
  }

  private attach() {
    this.hostEl.insertAdjacentElement("beforeend", this.element);
  }

  @Autobind
  dragLeaveHandler(_: DragEvent): void {
    const listEl = this.element.querySelector("ul")!;
    listEl.classList.remove("droppable");
  }

  @Autobind
  dragOverHandler(e: DragEvent): void {
    if (e.dataTransfer && e.dataTransfer.types[0] === "text/plain") {
      e.preventDefault();
      const listEl = this.element.querySelector("ul")!;
      listEl.classList.add("droppable");
    }
  }

  @Autobind
  dropHandler(e: DragEvent): void {
    const prjId = e.dataTransfer!.getData("text/plain");
    projectState.moveProject(
      prjId,
      this.type == "active" ? ProjectStatus.Active : ProjectStatus.Finished
    );
  }
}

const prjInput = new ProjectInput();
const activeProjects = new ProjectList("active");
const finishedProjects = new ProjectList("finished");

interface Monster {}

abstract class Abstract {
  /*
  ?? how do you get every name of monster
  ?? 
  */
  public readonly name: string;
  public location: [number, number];

  constructor(
    public challenge: number,
    public weakness: number,
    public locale: [number, number]
  ) {
    this.name = "joshua";
    this.location = [...locale];
    // console.log(this.challenge)
  }

  static logAll(name: string): void {
    console.log(name);
  }

  abstract stats(): void;
  //  abstract g(name:string) : void{
  //   console.log(name)
  // }

  createMonster(monster: string): void {
    //
  }
}
