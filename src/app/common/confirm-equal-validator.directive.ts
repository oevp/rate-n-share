import { Directive, Input } from "@angular/core";
import { Validator, NG_VALIDATORS, AbstractControl } from '@angular/forms';

@Directive({
    selector: '[appConfirmEqualValidator]',
    providers: [{ //add custom validator to NG_VALIDATORS 
        provide: NG_VALIDATORS,
        useExisting: ConfirmEqualValidatorDirective,
        multi: true
    }]
})
export class ConfirmEqualValidatorDirective implements Validator {
    @Input() appConfirmEqualValidator: string;
    validate(control: AbstractControl): { [key: string]: any } | null {
        //returns key/value object (value is any) or null
        //get the appConfirmEqualValidator field which is set to "password":
        const controlToCompare = control.parent.get(this.appConfirmEqualValidator);
        if (controlToCompare && controlToCompare.value !== control.value)
            return { 'notEqual': true };
        return null;
    }
}