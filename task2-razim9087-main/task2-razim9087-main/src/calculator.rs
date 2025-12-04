use std::{collections::btree_map::Values, fmt::format};

///-------------------------------------------------------------------------------
///
/// This is your calculator implementation task 
/// to practice enums, structs, and methods.
/// 
/// Complete the implementation of the Calculator struct and its methods.
/// 
/// The calculator should support basic arithmetic 
/// operations (addition, subtraction, multiplication)
/// with overflow protection and maintain a history 
/// of operations.
/// 
/// Tasks:
/// 1. Implement the OperationType enum methods
/// 2. Implement the Operation struct constructor
/// 3. Implement all Calculator methods
/// 
///-------------------------------------------------------------------------------

#[derive(Clone)]
pub enum OperationType {
    Addition,
    Subtraction,
    Multiplication
}

impl OperationType {
    // TODO: Return the string representation of the operation sign
    // Addition -> "+", Subtraction -> "-", Multiplication -> "*"
    pub fn get_sign(&self) -> &str {
        match self {
            OperationType::Addition => "+",
            OperationType::Subtraction => "-",
            OperationType::Multiplication => "*",
        }
    }
    
    // TODO: Perform the operation on two i64 numbers with overflow protection
    // Return Some(result) on success, None on overflow
    //
    // Example: OperationType::Multiplication.perform(x, y)
    pub fn perform(&self, x: i64, y: i64) -> Option<i64> {
        match self {
            OperationType::Addition=>x.checked_add(y),
            OperationType::Subtraction=>x.checked_sub(y),
            OperationType::Multiplication=>x.checked_mul(y)
        }
    }
}

#[derive(Clone)]
pub struct Operation {
    pub first_num: i64,
    pub second_num: i64,
    pub operation_type: OperationType
}

impl Operation {
    // TODO: Create a new Operation with the given parameters
    pub fn new(first_num: i64, second_num: i64, operation_type: OperationType) -> Self {
        Self{first_num,second_num,operation_type}
    }
}

pub struct Calculator {
    pub history: Vec<Operation>
}

impl Calculator {
    // TODO: Create a new Calculator with empty history
    pub fn new() -> Self {
        let history: Vec<Operation> = Vec::new();
        Self{history}
    }
    
    // TODO: Perform addition and store successful operations in history
    // Return Some(result) on success, None on overflow
    pub fn addition(&mut self, x: i64, y: i64) -> Option<i64> {
        let a: Option<i64> =  x.checked_add(y);
        match a {
        Some(value) => {
            
            self.history.push(Operation { first_num: x, second_num: y, operation_type: OperationType::Addition });
            return a;
        }
        None => {
            return a;
        }
    }
    }
    
    // TODO: Perform subtraction and store successful operations in history
    // Return Some(result) on success, None on overflow
    pub fn subtraction(&mut self, x: i64, y: i64) -> Option<i64> {
        let a: Option<i64> =  x.checked_sub(y);
        match a {
        Some(value) => {
            
            self.history.push(Operation { first_num: x, second_num: y, operation_type: OperationType::Subtraction });
            return a;
        } None => {
            return a;
        }
    }
    }
    
    
    // TODO: Perform multiplication and store successful operations in history
    // Return Some(result) on success, None on overflow
    pub fn multiplication(&mut self, x: i64, y: i64) -> Option<i64> {
        let a: Option<i64> =  x.checked_mul(y);
        match a {
        Some(value) => {
            self.history.push(Operation { first_num: x, second_num: y, operation_type: OperationType::Multiplication });
            return a;
        }
        None => {
            return a;
        }
    }
    }
    
    // TODO: Generate a formatted string showing all operations in history
    // Format: "index: first_num operation_sign second_num = result\n"
    //
    // Example: "0: 5 + 3 = 8\n1: 10 - 2 = 8\n"
    pub fn show_history(&self) -> String{
        let mut i: i32=0;
        let mut my_string: String = String::new();
        for item in &self.history{
            let x2: Option<i64>=item.operation_type.perform(item.first_num,item.second_num);
            let x3:i64=x2.unwrap_or(0);
            let x1: String=format!("{}: {} {} {} = {}\n",i,item.first_num,item.operation_type.get_sign(),item.second_num,x3);
            my_string=my_string+&x1;
            i=i+1;
            
        }
        return my_string;
    }
    
    // TODO: Repeat an operation from history by index
    // Add the repeated operation to history and return the result
    // Return None if the index is invalid
    pub fn repeat(&mut self, operation_index: usize) -> Option<i64>{
        let l1=self.history.len();
        let mut i=0;
        let mut m=false;
        for i in 0..l1{
            if operation_index==i{
                m=true;
                self.history.push(self.history[operation_index].clone());
                break;
            }
        }
        if m==true{
            let item=&mut self.history[operation_index];
            return item.operation_type.perform(item.first_num,item.second_num);

        } else {
            return None;
        }
    }
    
    // TODO: Clear all operations from history
    pub fn clear_history(&mut self) {
        self.history.clear();
    }
}
