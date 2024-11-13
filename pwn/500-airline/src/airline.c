#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdint.h>
#define MAX_TICKETS 1000
#define NAME_LENGTH 22
#define EXIT_SUCCESS 0
#define EXIT_FAILURE 1

struct ticket {
    char name[NAME_LENGTH];
    char origin[4];
    char destination[4];
    uint8_t age;
    uint8_t used;
};

struct ticket TICKETS[MAX_TICKETS];
char admin_password[60];

void null_newline(char *str, size_t len){
    for (int i = 0; i < len; i++){
        if (str[i] == '\n'){
            str[i] = '\x00';
            break;
        }
    }
}

void buffer_overflow(){
    char user_input[8];
    fread(user_input, sizeof(char), 128, stdin);
    return;
}

void print_main_screen(uint8_t is_admin){
    if (is_admin == 0){
        printf("************************************************************\n");
        printf("*                      AIRLINE TERMINAL                    *\n");
        printf("************************************************************\n");
        printf("* 1. Add Ticket                                            *\n");
        printf("* 2. Delete Ticket                                         *\n");
        printf("* 3. View Ticket                                           *\n");
        printf("* 4. Admin Login                                           *\n");
        printf("* 5. Exit                                                  *\n");
        printf("************************************************************\n");
    } else {
        printf("************************************************************\n");
        printf("*                      AIRLINE TERMINAL                    *\n");
        printf("************************************************************\n");
        printf("* 1. Add Ticket                                            *\n");
        printf("* 2. Delete Ticket                                         *\n");
        printf("* 3. View Ticket                                           *\n");
        printf("* 4. Admin Login                                           *\n");
        printf("* 5. Exit                                                  *\n");
        printf("* 6. Edit Ticket                                           *\n");
        printf("************************************************************\n");
    }
}

uint64_t total_tickets;

int32_t get_ticket_idx(){
    int32_t index = 0;
    printf("> Enter ticket id: ");
    char *buffer = NULL;
    size_t buffer_len = 0;
    getline(&buffer, &buffer_len, stdin);
    index = atoi(buffer);
    free(buffer);
    return index;
}

uint8_t option(char *prompt){
    uint8_t option = 0;
    printf("%s", prompt);
    char *buffer = NULL;
    size_t buffer_len = 0;
    getline(&buffer, &buffer_len, stdin);
    if (buffer[0] == 'y'){
        option = 1;
    }
    free(buffer);
    return option;
}

void edit_ticket(){
    struct ticket this_ticket;
    
    // get ticket index
    int32_t index = get_ticket_idx();
    this_ticket = TICKETS[index];

    if (option("> Edit Origin (y/n): ")){
        printf("> Enter origin:");
        fread((char*)this_ticket.origin, sizeof(char), 4, stdin);
        this_ticket.origin[3]='\x00';
    }
    if (option("> Edit Destination (y/n): ")){
        printf("> Enter Destination:");
        fread((char*)this_ticket.destination, sizeof(char), 4, stdin);
        this_ticket.destination[3]='\x00';
    }

    if (option("> Edit Passenger name (y/n): ")){
        char *buffer = NULL;
        size_t buffer_len = 0;
        printf("> Enter new name:");
        getline(&buffer, &buffer_len, stdin);
        null_newline(buffer, buffer_len);
        memcpy(this_ticket.name, buffer, NAME_LENGTH);
        free(buffer);
    }

    if (option("> Edit Passenger age (y/n): ")){
        char *buffer = NULL;
        size_t buffer_len = 0;
        printf("> Enter new age:");
        getline(&buffer, &buffer_len, stdin);
        this_ticket.age = (uint8_t)(atoi(buffer));
        free(buffer);
    }

    if (option("> Set ticket as used (y/n): ")){
        this_ticket.used = 1;
        printf("* Ticket marked as used.");
    }

    if (option("> Save changes? (y/n):")){
        TICKETS[index] = this_ticket;
    }


}


void add_ticket(){
    if (total_tickets > MAX_TICKETS){
        printf("* ERR: Maximum number of tickets reached!\n");
        return;
    }
    struct ticket new_ticket = {0};
    char *buffer = NULL;
    size_t buffer_len = 0;
    printf("> Enter passenger name: ");
    int result = getline(&buffer, &buffer_len, stdin);
    if (result == -1){
        printf("ERROR:\n");
        exit(EXIT_FAILURE);
        return;
    }
    null_newline(buffer, buffer_len);
    strncpy(new_ticket.name, buffer, NAME_LENGTH);
    printf("> Enter passenger age:");
    scanf(" %hhu", &new_ticket.age);
    strcpy(new_ticket.origin, "PDX");
    printf("> Enter destination (3 characters): ");
    fread((char*)new_ticket.destination, sizeof(char), 4, stdin);
    new_ticket.destination[3]='\x00';
    new_ticket.used=0;

    total_tickets++;
    for (int i=0; i < total_tickets; i++){
        if (TICKETS[i].used == 0){
            TICKETS[i] = new_ticket;
        }
    }
    printf("\n************************************************************\n");
    printf("* CREATED NEW TICKET SUCCESSFULLY!                         *\n");
    printf("************************************************************\n");
    printf("* INFO: Passenger \"%s\" of age %hhu, is booked for a flight to %s\n", new_ticket.name, new_ticket.age, new_ticket.destination);
    printf("************************************************************\n");
    return;
}

uint8_t admin_login(char *admin_pwd){
    printf("> Enter Admin Password: ");
    char *buffer = NULL;
    size_t buffer_len = 0;
    getline(&buffer, &buffer_len, stdin);
    size_t pwd_len = strlen(admin_pwd);
    if (strncmp(admin_pwd, buffer, pwd_len) == 0){
        printf("* Admin user logged in\n");
        return 1;
    }
    printf("* Incorrect Password\n");
    return 0;
}

void del_ticket(){
    int ticket_id = get_ticket_idx();
    memset(&TICKETS[ticket_id], 0, sizeof(struct ticket));
    total_tickets--;
    return;
}

void view_ticket(){
    int32_t index = get_ticket_idx();
    printf("* Ticket info:\n* %s->%s\n* Passenger name: %s\n* Passenger age: %hhu\n", TICKETS[index].origin, TICKETS[index].destination, TICKETS[index].name, TICKETS[index].age);
    return;
}

int main(int argc, char **argv){
    // disable buffering
    setvbuf(stdout, NULL, _IONBF, 0);
    total_tickets = 0;

    uint8_t is_admin = 0;
    FILE* password_file = fopen("password", "r");
    fread(admin_password, sizeof(char), 20, password_file);
    fclose(password_file);

    while (1) {
        print_main_screen(is_admin);
        char input;
        printf("> Enter option: ");
        char *user_input = NULL;
        size_t user_len = 0;
        getline(&user_input, &user_len, stdin);
        input = user_input[0];

        if (input == '1') {
            add_ticket();
        }
        if (input == '2') {
            del_ticket();
        }
        if (input == '3') {
            view_ticket();
        }
        if (input == '4') {
            is_admin = admin_login(admin_password);
        }
        if (input == '5') {
            break;
        }
        if ((input == '6') && (is_admin == 1)){
            edit_ticket();
        }
        if (user_input != NULL){
            free(user_input);
        }
        user_input = NULL;
    }
    exit(EXIT_SUCCESS);
}