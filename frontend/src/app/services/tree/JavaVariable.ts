export class JavaVariable {
    type : string
    name : string 

    constructor(declaration : string) {
        const declarationArray = declaration.trim().split(' ')
        this.type = declarationArray[0]
        this.name = declarationArray[1]
    }

    equalName(variable : JavaVariable) : boolean {
        return this.name == variable.name
    }

    public toString() {
        return this.type + ' ' + this.name
    }
}